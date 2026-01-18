const supabase = require('../supabaseClient');

// ============================
// Reset Enrollments (Admin)
// ============================
exports.resetEnrollments = async (req, res) => {
  try {
    // Delete all enrollment records safely
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .neq('enrollment_id', 0);

    if (error) {
      console.error("RESET ENROLLMENTS ERROR:", error);
      return res.status(500).json({ error: "Failed to reset enrollments." });
    }

    res.status(200).json({
      message: "Enrollments reset successfully."
    });
  } catch (err) {
    console.error("RESET ENROLLMENTS EXCEPTION:", err);
    res.status(500).json({ error: "Reset failed due to server error." });
  }
};
