const supabase = require('../supabaseClient');

// Apply for course
exports.applyForCourse = async (req, res) => {
  const { student_id, course_id } = req.body;

  try {
    const { error } = await supabase.from('enrollments').insert([
      {
        student_id,
        course_id,
        status: 'PENDING_INSTRUCTOR_APPROVAL'
      }
    ]);

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          error: "Duplicate Application",
          message: "Already applied for this course."
        });
      }
      throw error;
    }

    res.status(201).json({ message: "Application submitted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to apply for course." });
  }
};

// Drop course
exports.dropCourse = async (req, res) => {
  const { enrollmentId } = req.body;

  try {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('grade')
      .eq('enrollment_id', enrollmentId)
      .single();

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found." });
    }

    if (enrollment.grade) {
      return res.status(403).json({
        error: "Course already graded, cannot drop."
      });
    }

    await supabase
      .from('enrollments')
      .update({ status: 'DROPPED_BY_STUDENT' })
      .eq('enrollment_id', enrollmentId);

    res.json({ message: "Course dropped successfully." });
  } catch (err) {
    res.status(500).json({ error: "Drop failed." });
  }
};
