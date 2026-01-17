const supabase = require('../supabaseClient');

// View applications for a course
const getCourseApplications = async (req, res) => {
  const { courseId } = req.params;

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        enrollment_id,
        status,
        grade,
        users (
          full_name,
          email,
          department
        )
      `)
      .eq('course_id', courseId);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch applications." });
  }
};

// Award grade
const awardGrade = async (req, res) => {
  const { enrollmentId, grade } = req.body;

  try {
    const { error } = await supabase
      .from('enrollments')
      .update({ grade, status: 'ENROLLED' })
      .eq('enrollment_id', enrollmentId);

    if (error) throw error;

    res.json({ message: "Grade awarded successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to award grade." });
  }
};

module.exports = {
  getCourseApplications,
  awardGrade
};
