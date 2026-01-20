const supabase = require('../supabaseClient');
const { sendStatusEmail } = require('../utils/sendEmail');

/* ===================================================
   Helper: Update Course Enrolled Count
=================================================== */
const updateCourseEnrolledCount = async (course_id) => {
  try {
    const { count, error } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", course_id)
      .eq("status", "ENROLLED");

    if (!error) {
      await supabase
        .from("courses")
        .update({ enrolled_count: count })
        .eq("course_id", course_id);
    }
  } catch (err) {
    console.error("Failed to update course count:", err);
  }
};

// ===================================
// 1. Apply for a course
// ===================================
exports.applyForCourse = async (req, res) => {
  const { student_id, course_id } = req.body;
  try {
    // Fetch details for email
    const { data: student } = await supabase.from('users').select('full_name, email').eq('user_id', student_id).single();
    const { data: course } = await supabase.from('courses').select('title').eq('course_id', course_id).single();

    // Check existing
    const { data: existing } = await supabase.from('enrollments').select('enrollment_id, status').eq('student_id', student_id).eq('course_id', course_id).maybeSingle();

    if (existing) {
      if (['DROPPED_BY_STUDENT', 'INSTRUCTOR_REJECTED', 'ADVISOR_REJECTED'].includes(existing.status)) {
        await supabase.from('enrollments').update({ status: 'PENDING_INSTRUCTOR_APPROVAL', grade: null }).eq('enrollment_id', existing.enrollment_id);
        if (student && course) await sendStatusEmail(student.email, student.full_name, course.title, 'PENDING_INSTRUCTOR_APPROVAL');
        return res.json({ message: 'Re-application submitted.' });
      } else {
        return res.status(400).json({ error: 'Active application exists.' });
      }
    }

    await supabase.from('enrollments').insert([{ student_id, course_id, status: 'PENDING_INSTRUCTOR_APPROVAL' }]);
    if (student && course) await sendStatusEmail(student.email, student.full_name, course.title, 'PENDING_INSTRUCTOR_APPROVAL');
    
    res.status(201).json({ message: 'Application submitted.' });
  } catch (err) {
    console.error('APPLY ERROR:', err);
    res.status(500).json({ error: 'Failed to apply.' });
  }
};

// ===================================
// 2. Drop a course
// ===================================
exports.dropCourse = async (req, res) => {
  const { enrollmentId } = req.body;

  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        grade,
        status,
        course_id,
        course:courses(title),
        student:users(email, full_name)
      `)
      .eq('enrollment_id', enrollmentId)
      .single();

    if (error || !enrollment) return res.status(404).json({ error: 'Enrollment not found.' });
    if (enrollment.grade !== null) return res.status(403).json({ error: 'Cannot drop graded course.' });

    // 1. Update Status
    await supabase
      .from('enrollments')
      .update({ status: 'DROPPED_BY_STUDENT' })
      .eq('enrollment_id', enrollmentId);

    // 2. 🚀 UPDATE DATABASE COUNT (If they were enrolled)
    if (enrollment.status === 'ENROLLED') {
      await updateCourseEnrolledCount(enrollment.course_id);
    }

    // 3. Email
    if (enrollment.student && enrollment.course) {
      await sendStatusEmail(
        enrollment.student.email, 
        enrollment.student.full_name, 
        enrollment.course.title, 
        'DROPPED_BY_STUDENT'
      );
    }

    res.json({ message: 'Course dropped successfully.' });
  } catch (err) {
    console.error('DROP COURSE ERROR:', err);
    res.status(500).json({ error: 'Drop failed.' });
  }
};

// ===================================
// 3. Get student records
// ===================================
exports.getStudentRecords = async (req, res) => {
  const { student_id, session } = req.query;
  try {
    const { data, error } = await supabase.from('enrollments').select(`enrollment_id, status, grade, course_id, courses(course_id, course_code, title, acad_session)`).eq('student_id', student_id).eq('courses.acad_session', session).order('enrollment_id', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch records.' }); }
};

// ===================================
// 4. Get Student Profile
// ===================================
exports.getStudentProfile = async (req, res) => {
  const { student_id } = req.query;
  try {
    const { data: student } = await supabase.from('users').select(`user_id, full_name, email, role, department, advisor_id`).eq('user_id', student_id).single();
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    const { data: profile } = await supabase.from('student_profile').select('batch, entry_no').eq('student_id', student_id).single();
    let advisor = null;
    if (student.advisor_id) {
       const { data: adv } = await supabase.from('users').select('user_id, full_name, email').eq('user_id', student.advisor_id).single();
       advisor = adv;
    }
    res.json({ ...student, student_profile: profile || null, advisor });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch profile.' }); }
};

// ===================================
// 5. Feedback Options
// ===================================
exports.getFeedbackOptions = async (req, res) => {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ error: "student_id required" });
    try {
        const { data, error } = await supabase.from("enrollments").select(`course_id, courses:courses(course_id, course_code, title, acad_session, faculty_id, instructor:users!courses_faculty_id_fkey(user_id, full_name))`).eq("student_id", student_id).eq("status", "ENROLLED");
        if(error) throw error;
        const options = (data||[]).map(row => {
            const c = row.courses; if(!c) return null;
            return { course_id: c.course_id, course_code: c.course_code, title: c.title, acad_session: c.acad_session, instructor_id: c.faculty_id, instructor_name: c.instructor?.full_name || "—" };
        }).filter(Boolean);
        res.json(options);
    } catch(err) { res.status(500).json({ error: "Failed." }); }
};

// ===================================
// 6. Submit Feedback
// ===================================
exports.submitInstructorFeedback = async (req, res) => {
    const { student_id, course_id, instructor_id, feedback_type, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11 } = req.body;
    try {
        const { data: enr } = await supabase.from("enrollments").select("status, course:courses(faculty_id)").eq("student_id", student_id).eq("course_id", course_id).maybeSingle();
        if(!enr || enr.status !== "ENROLLED" || String(enr.course.faculty_id) !== String(instructor_id)) return res.status(403).json({ error: "Invalid." });
        
        const { data: ext } = await supabase.from("course_instructor_feedback").select("feedback_id").eq("student_id", student_id).eq("course_id", course_id).eq("instructor_id", instructor_id).eq("feedback_type", feedback_type).maybeSingle();
        if(ext) return res.status(400).json({ error: "Already submitted." });

        await supabase.from("course_instructor_feedback").insert([{ student_id, course_id, instructor_id, feedback_type, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11 }]);
        res.status(201).json({ message: "Submitted." });
    } catch(err) { res.status(500).json({ error: "Failed." }); }
};