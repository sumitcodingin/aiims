const supabase = require('../supabaseClient');
const { sendStatusEmail } = require('../utils/sendEmail');

// ===================================
// Apply for a course
// ===================================
exports.applyForCourse = async (req, res) => {
  const { student_id, course_id } = req.body;

  try {
    // 0. Fetch Student & Course Details for Email Notifications
    const { data: student } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('user_id', student_id)
      .single();

    const { data: course } = await supabase
      .from('courses')
      .select('title, course_code')
      .eq('course_id', course_id)
      .single();

    // 1. Check if an enrollment already exists
    const { data: existing, error: fetchError } = await supabase
      .from('enrollments')
      .select('enrollment_id, status')
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .maybeSingle(); 

    if (fetchError) throw fetchError;

    if (existing) {
      // 2. If it exists and was dropped/rejected, "re-activate" it
      if (['DROPPED_BY_STUDENT', 'INSTRUCTOR_REJECTED', 'ADVISOR_REJECTED'].includes(existing.status)) {
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({ 
            status: 'PENDING_INSTRUCTOR_APPROVAL',
            grade: null 
          })
          .eq('enrollment_id', existing.enrollment_id);

        if (updateError) throw updateError;

        // EMAIL NOTIFICATION
        if (student && course) {
          await sendStatusEmail(student.email, student.full_name, course.title, 'PENDING_INSTRUCTOR_APPROVAL');
        }

        return res.json({ message: 'Re-application submitted successfully.' });
      } else {
        return res.status(400).json({ 
          error: 'Invalid Action', 
          message: 'You already have an active application or enrollment for this course.' 
        });
      }
    }

    // 3. If no record exists, perform the standard insert
    const { error: insertError } = await supabase.from('enrollments').insert([
      {
        student_id,
        course_id,
        status: 'PENDING_INSTRUCTOR_APPROVAL',
      },
    ]);

    if (insertError) throw insertError;

    // EMAIL NOTIFICATION
    if (student && course) {
      await sendStatusEmail(student.email, student.full_name, course.title, 'PENDING_INSTRUCTOR_APPROVAL');
    }

    res.status(201).json({
      message: 'Enrollment request submitted. Awaiting instructor approval.',
    });
  } catch (err) {
    console.error('APPLY COURSE ERROR:', err);
    res.status(500).json({ error: 'Failed to submit enrollment request.' });
  }
};

// ===================================
// Drop a course
// ===================================
exports.dropCourse = async (req, res) => {
  const { enrollmentId } = req.body;

  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        grade,
        course:courses(title),
        student:users(email, full_name)
      `)
      .eq('enrollment_id', enrollmentId)
      .single();

    if (error || !enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    if (enrollment.grade !== null) {
      return res.status(403).json({
        error: 'Course already graded, cannot drop.',
      });
    }

    await supabase
      .from('enrollments')
      .update({ status: 'DROPPED_BY_STUDENT' })
      .eq('enrollment_id', enrollmentId);

    // EMAIL NOTIFICATION (Optional for Drop)
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
// Get student records (THIS SEMESTER)
// ===================================
exports.getStudentRecords = async (req, res) => {
  const { student_id, session } = req.query;

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        enrollment_id,
        status,
        grade,
        course_id,
        courses (
          course_id,
          course_code,
          title,
          acad_session
        )
      `)
      .eq('student_id', student_id)
      .eq('courses.acad_session', session)
      .order('enrollment_id', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('STUDENT RECORDS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch student records.' });
  }
};

exports.getStudentProfile = async (req, res) => {
  const { student_id } = req.query;

  try {
    const { data: student, error } = await supabase
      .from('users')
      .select(`
        user_id,
        full_name,
        email,
        role,
        department,
        advisor_id,
        created_at
      `)
      .eq('user_id', student_id)
      .single();

    if (error || !student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const { data: profileData } = await supabase
      .from('student_profile')
      .select('batch, entry_no')
      .eq('student_id', student_id)
      .single();

    let advisor = null;
    if (student.advisor_id) {
      const { data: advisorData } = await supabase
        .from('users')
        .select('user_id, full_name, email')
        .eq('user_id', student.advisor_id)
        .single();
      advisor = advisorData || null;
    }

    res.json({
      ...student,
      student_profile: profileData || null,
      advisor,
    });
  } catch (err) {
    console.error('STUDENT PROFILE ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
};

// ===================================
// Course Instructor Feedback
// ===================================
exports.getFeedbackOptions = async (req, res) => {
  const { student_id } = req.query;
  if (!student_id) return res.status(400).json({ error: "student_id is required." });

  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
          course_id,
          courses:courses (
            course_id,
            course_code,
            title,
            acad_session,
            faculty_id,
            instructor:users!courses_faculty_id_fkey (
              user_id,
              full_name
            )
          )
        `)
      .eq("student_id", student_id)
      .eq("status", "ENROLLED");

    if (error) throw error;

    const options = (data || []).map((row) => {
          const c = row.courses;
          if (!c) return null;
          return {
            course_id: c.course_id,
            course_code: c.course_code,
            title: c.title,
            acad_session: c.acad_session,
            instructor_id: c.faculty_id,
            instructor_name: c.instructor?.full_name || "—",
          };
        }).filter(Boolean);

    res.json(options);
  } catch (err) {
    console.error("GET FEEDBACK OPTIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch feedback options." });
  }
};

exports.submitInstructorFeedback = async (req, res) => {
  const { student_id, course_id, instructor_id, feedback_type, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11 } = req.body;
  const required = { student_id, course_id, instructor_id, feedback_type, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 };
  const missing = Object.entries(required).filter(([, v]) => v == null || String(v).trim() === "").map(([k]) => k);

  if (missing.length) return res.status(400).json({ error: "Missing required fields.", fields: missing });

  try {
    const { data: enrollment, error: enrollmentErr } = await supabase
      .from("enrollments")
      .select("enrollment_id, status, course:courses(faculty_id)")
      .eq("student_id", student_id)
      .eq("course_id", course_id)
      .maybeSingle();

    if (enrollmentErr) throw enrollmentErr;
    if (!enrollment || enrollment.status !== "ENROLLED") {
      return res.status(403).json({ error: "You can submit feedback only for courses you are enrolled in." });
    }
    if (String(enrollment.course?.faculty_id) !== String(instructor_id)) {
      return res.status(403).json({ error: "Invalid instructor for this course." });
    }

    const { data: existing, error: existingErr } = await supabase
      .from("course_instructor_feedback")
      .select("feedback_id")
      .eq("student_id", student_id)
      .eq("course_id", course_id)
      .eq("instructor_id", instructor_id)
      .eq("feedback_type", feedback_type)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) {
      return res.status(400).json({ error: "Feedback already submitted.", message: "Feedback for this course instructor can be submitted only once." });
    }

    const { error: insertErr } = await supabase.from("course_instructor_feedback").insert([{
          student_id, course_id, instructor_id, feedback_type, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11: q11 || null,
        }]);

    if (insertErr) throw insertErr;
    res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (err) {
    console.error("SUBMIT FEEDBACK ERROR:", err);
    res.status(500).json({ error: "Failed to submit feedback." });
  }
};