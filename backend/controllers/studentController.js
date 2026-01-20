const supabase = require('../supabaseClient');

// ===================================
// Apply for a course
// ===================================
exports.applyForCourse = async (req, res) => {
  const { student_id, course_id } = req.body;

  try {
    // 1. Check if an enrollment already exists for this student and course
    const { data: existing, error: fetchError } = await supabase
      .from('enrollments')
      .select('enrollment_id, status')
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .maybeSingle(); // Use maybeSingle to avoid errors if no record is found

    if (fetchError) throw fetchError;

    if (existing) {
      // 2. If it exists and was dropped, "re-activate" it
      if (existing.status === 'DROPPED_BY_STUDENT' || existing.status === 'INSTRUCTOR_REJECTED' || existing.status === 'ADVISOR_REJECTED') {
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({ 
            status: 'PENDING_INSTRUCTOR_APPROVAL',
            grade: null // Reset grade if they re-apply
          })
          .eq('enrollment_id', existing.enrollment_id);

        if (updateError) throw updateError;
        return res.json({ message: 'Re-application submitted successfully.' });
      } else {
        // If they are already enrolled or pending, block the request
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
      .select('grade')
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
    // Fetch student
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

    // SEPARATE fetch for the 'student_profile' table
    const { data: profileData } = await supabase
      .from('student_profile')
      .select('batch, entry_no')
      .eq('student_id', student_id)
      .single();

    let advisor = null;

    // Fetch advisor separately (if exists)
    if (student.advisor_id) {
      const { data: advisorData } = await supabase
        .from('users')
        .select('user_id, full_name, email')
        .eq('user_id', student.advisor_id)
        .single();

      advisor = advisorData || null;
    }

    // Merge response
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