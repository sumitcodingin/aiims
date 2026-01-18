const supabase = require('../supabaseClient');

// ============================
// Advisor Approval Controller
// ============================
exports.approveByAdvisor = async (req, res) => {
  const { enrollmentId, action, advisor_id } = req.body;

  try {
    // 1. Fetch enrollment + student advisor info
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

    // 2. Ownership check (advisor ↔ student)
    if (enrollment.student.advisor_id !== advisor_id) {
      return res.status(403).json({
        error: "Unauthorized. You are not the assigned advisor for this student."
      });
    }

    // 3. Lock invalid transitions
    if (enrollment.status === 'INSTRUCTOR_REJECTED') {
      return res.status(400).json({
        error: "Action locked. Instructor has already rejected this request."
      });
    }

    if (enrollment.status === 'DROPPED_BY_STUDENT') {
      return res.status(400).json({
        error: "Action locked. Student has already dropped this course."
      });
    }

    if (enrollment.status === 'ADVISOR_REJECTED') {
      return res.status(400).json({
        error: "Action locked. Advisor has already rejected this request."
      });
    }

    // 4. Decide new status
    const newStatus =
      action === 'ACCEPT'
        ? 'ENROLLED'
        : 'ADVISOR_REJECTED';

    // 5. Update enrollment
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
    console.error("ADVISOR APPROVAL ERROR:", err);
    res.status(500).json({ error: "Advisor approval failed." });
  }
};
