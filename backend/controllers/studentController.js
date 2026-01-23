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
    // 1. Fetch details of the course to be applied for (including SLOT and SESSION)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, slot, acad_session')
      .eq('course_id', course_id)
      .single();

    if (courseError || !course) {
        return res.status(404).json({ error: "Course not found." });
    }

    const { data: student } = await supabase.from('users').select('full_name, email').eq('user_id', student_id).single();

    // 2. Check existing application for THIS course
    const { data: existing } = await supabase
        .from('enrollments')
        .select('enrollment_id, status')
        .eq('student_id', student_id)
        .eq('course_id', course_id)
        .maybeSingle();

    if (existing) {
      if (['DROPPED_BY_STUDENT', 'INSTRUCTOR_REJECTED', 'ADVISOR_REJECTED'].includes(existing.status)) {
        // Re-applying is fine, BUT we still need to check slot collision below
      } else {
        return res.status(400).json({ error: 'Active application exists.' });
      }
    }

    // 3. 🚀 EDGE CASE 2: Check for Slot Collision with other ENROLLED courses in the same session
    // We need to fetch all enrollments for this student where status is 'ENROLLED'
    // and the linked course has the same session and same slot.
    
    // Fetch all enrolled courses for this student
    const { data: enrolledCourses, error: enrolledError } = await supabase
        .from('enrollments')
        .select(`
            status,
            courses!inner (
                course_id,
                slot,
                acad_session
            )
        `)
        .eq('student_id', student_id)
        .eq('status', 'ENROLLED');

    if (enrolledError) throw enrolledError;

    if (enrolledCourses && enrolledCourses.length > 0) {
        for (const record of enrolledCourses) {
            // Check if sessions match (usually we only care about collision in the current session)
            if (record.courses.acad_session === course.acad_session) {
                if (record.courses.slot === course.slot) {
                    return res.status(400).json({ 
                        error: `You have already enrolled course which is on slot ${course.slot}. Please drop that course before applying` 
                    });
                }
            }
        }
    }
    // -------------------------------------------------------------

    // 4. Proceed with Insert / Update
    if (existing && ['DROPPED_BY_STUDENT', 'INSTRUCTOR_REJECTED', 'ADVISOR_REJECTED'].includes(existing.status)) {
        await supabase.from('enrollments').update({ status: 'PENDING_INSTRUCTOR_APPROVAL', grade: null }).eq('enrollment_id', existing.enrollment_id);
        if (student && course) await sendStatusEmail(student.email, student.full_name, course.title, 'PENDING_INSTRUCTOR_APPROVAL');
        return res.json({ message: 'Re-application submitted.' });
    }

    await supabase.from('enrollments').insert([{ student_id, course_id, status: 'PENDING_INSTRUCTOR_APPROVAL' }]);
    if (student && course) await sendStatusEmail(student.email, student.full_name, course.title, 'PENDING_INSTRUCTOR_APPROVAL');
    
    res.status(201).json({ message: 'Application submitted.' });
  } catch (err) {
    console.error('APPLY ERROR:', err);
    res.status(500).json({ error: err.message || 'Failed to apply.' });
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
// Helper: Grade Point Mapping
// ===================================
const GRADE_POINTS = {
  'A': 10, 'A-': 9, 'B': 8, 'B-': 7, 'C': 6, 'C-': 5, 'D': 4,
  'E': 2, 'F': 0, 'NP': null, 'NF': null, 'I': null, 'W': null, 'S': null, 'U': null
};

const calculateSGPA = (records) => {
  let totalPoints = 0;
  let totalCredits = 0;
  
  records.forEach(record => {
    if (record.courses && record.grade && GRADE_POINTS[record.grade] !== null) {
      const gradePoint = GRADE_POINTS[record.grade];
      const credits = record.courses.credits || 0;
      totalPoints += credits * gradePoint;
      totalCredits += credits;
    }
  });
  
  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
};

// ===================================
// 3. Get student records
// ===================================
exports.getStudentRecords = async (req, res) => {
  const { student_id, session } = req.query;
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`enrollment_id, status, grade, course_id, courses(course_id, course_code, title, acad_session, credits)`)
      .eq('student_id', student_id)
      .eq('courses.acad_session', session)
      .order('enrollment_id', { ascending: false });
    
    if (error) throw error;
    
    const sgpa = calculateSGPA(data);
    res.json({ records: data, sgpa });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch records.' }); }
};

// ===================================
// 4. Get all student records (for CGPA)
// ===================================
exports.getAllStudentRecords = async (req, res) => {
  const { student_id } = req.query;
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`enrollment_id, status, grade, course_id, courses(course_id, course_code, title, acad_session, credits)`)
      .eq('student_id', student_id)
      .order('courses(acad_session)', { ascending: true });
    
    if (error) throw error;
    
    // Group by session
    const bySession = {};
    data.forEach(record => {
      const session = record.courses?.acad_session || 'Unknown';
      if (!bySession[session]) bySession[session] = [];
      bySession[session].push(record);
    });
    
    // Calculate SGPA for each session and overall CGPA
    let totalCumulativePoints = 0;
    let totalCumulativeCredits = 0;
    const sessions = {};
    
    Object.entries(bySession).forEach(([session, records]) => {
      const sgpa = calculateSGPA(records);
      
      // Calculate credits for this session
      let sessionCredits = 0;
      let sessionEarnedCredits = 0;
      records.forEach(record => {
        if (record.courses?.credits) {
          sessionCredits += record.courses.credits;
          if (record.status === 'ENROLLED' && record.grade && !['F', 'NF', 'I', 'W'].includes(record.grade)) {
            sessionEarnedCredits += record.courses.credits;
          }
        }
      });
      
      sessions[session] = {
        sgpa,
        credits_registered: sessionCredits,
        credits_earned: sessionEarnedCredits,
        records
      };
      
      // Add to cumulative (only passed courses)
      records.forEach(record => {
        if (record.grade && GRADE_POINTS[record.grade] !== null && ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'E'].includes(record.grade)) {
          const gradePoint = GRADE_POINTS[record.grade];
          const credits = record.courses?.credits || 0;
          totalCumulativePoints += credits * gradePoint;
          totalCumulativeCredits += credits;
        }
      });
    });
    
    const cgpa = totalCumulativeCredits > 0 ? (totalCumulativePoints / totalCumulativeCredits).toFixed(2) : '0.00';
    
    res.json({ sessions, cgpa, totalCumulativeCredits });
  } catch (err) { 
    console.error('GET ALL RECORDS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch all records.' }); 
  }
};

// ===================================
// 5. Get Student Profile
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