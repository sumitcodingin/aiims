const supabase = require('../supabaseClient');

// ===================================================
// 1. Approve / Reject STUDENT ENROLLMENT (UNCHANGED)
// ===================================================
exports.approveByAdvisor = async (req, res) => {
  const { enrollmentId, action, advisor_id } = req.body;

  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        status,
        student:users!student_id (
          advisor_id
        )
      `)
      .eq('enrollment_id', enrollmentId)
      .single();

    if (error || !enrollment) {
      return res.status(404).json({ error: "Enrollment record not found." });
    }

    if (enrollment.student.advisor_id !== advisor_id) {
      return res.status(403).json({
        error: "Unauthorized. You are not the assigned advisor for this student."
      });
    }

    if (
      ['INSTRUCTOR_REJECTED', 'DROPPED_BY_STUDENT', 'ADVISOR_REJECTED']
        .includes(enrollment.status)
    ) {
      return res.status(400).json({
        error: "Action locked. Enrollment already finalized."
      });
    }

    const newStatus =
      action === 'ACCEPT'
        ? 'ENROLLED'
        : 'ADVISOR_REJECTED';

    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ status: newStatus })
      .eq('enrollment_id', enrollmentId);

    if (updateError) throw updateError;

    res.status(200).json({
      message: "Advisor decision updated successfully.",
      status: newStatus
    });
  } catch (err) {
    console.error("ADVISOR ENROLLMENT ERROR:", err);
    res.status(500).json({ error: "Advisor approval failed." });
  }
};

// ===================================================
// 2. Get COURSES pending advisor approval (BY DEPARTMENT)
// ===================================================
exports.getPendingCourses = async (req, res) => {
  const { advisor_id } = req.query;

  try {
    // 1. Fetch advisor department
    const { data: advisor, error: advisorError } = await supabase
      .from('users')
      .select('department')
      .eq('user_id', advisor_id)
      .single();

    if (advisorError || !advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    // 2. Fetch pending courses of same department
    const { data, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        course_code,
        title,
        department,
        acad_session,
        capacity,
        status,
        instructor:users!courses_faculty_id_fkey (
          full_name,
          email
        )
      `)
      .eq('status', 'PENDING_ADVISOR_APPROVAL')
      .eq('department', advisor.department);

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("GET PENDING COURSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch pending courses." });
  }
};

// ===================================================
// 3. Approve / Reject FLOATED COURSE (BY DEPARTMENT)
// ===================================================
exports.approveCourse = async (req, res) => {
  const { course_id, action, advisor_id } = req.body;

  try {
    // 1. Fetch advisor department
    const { data: advisor, error: advisorError } = await supabase
      .from('users')
      .select('department')
      .eq('user_id', advisor_id)
      .single();

    if (advisorError || !advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    // 2. Fetch course
    const { data: course, error } = await supabase
      .from('courses')
      .select('department, status')
      .eq('course_id', course_id)
      .single();

    if (error || !course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // 3. Department ownership check
    if (course.department !== advisor.department) {
      return res.status(403).json({
        error: "Unauthorized. Course does not belong to your department."
      });
    }

    if (course.status !== 'PENDING_ADVISOR_APPROVAL') {
      return res.status(400).json({
        error: "Course already finalized."
      });
    }

    const newStatus =
      action === 'APPROVE'
        ? 'APPROVED'
        : 'REJECTED';

    const { error: updateError } = await supabase
      .from('courses')
      .update({ status: newStatus })
      .eq('course_id', course_id);

    if (updateError) throw updateError;

    res.status(200).json({
      message: `Course ${newStatus.toLowerCase()} successfully.`,
      status: newStatus
    });
  } catch (err) {
    console.error("COURSE APPROVAL ERROR:", err);
    res.status(500).json({ error: "Failed to process course approval." });
  }
};
