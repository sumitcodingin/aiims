const supabase = require('../supabaseClient');

exports.resetEnrollments = async (req, res) => {
  try {
    await supabase.from('enrollments').delete().neq('enrollment_id', 0);
    res.json({ message: "Enrollments reset successfully." });
  } catch (err) {
    res.status(500).json({ error: "Reset failed." });
  }
};
