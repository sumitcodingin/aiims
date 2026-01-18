const supabase = require('../supabaseClient');

// ============================
// 1. View applications for a course
// ============================
const getCourseApplications = async (req, res) => {
  const { courseId } = req.params;

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        enrollment_id,
        status,
        grade,
        student:users (
          user_id,
          full_name,
          email,
          department
        )
      `)
      .eq('course_id', courseId);

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("GET APPLICATIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch applications." });
  }
};

// ============================
// 2. Award grade (Instructor)
// ============================
const awardGrade = async (req, res) => {
  const { enrollmentId, grade } = req.body;

  try {
    const { error } = await supabase
      .from('enrollments')
      .update({
        grade: grade,
        status: 'ENROLLED'
      })
      .eq('enrollment_id', enrollmentId);

    if (error) throw error;

    res.status(200).json({ message: "Grade awarded successfully." });
  } catch (err) {
    console.error("AWARD GRADE ERROR:", err);
    res.status(500).json({ error: "Failed to award grade." });
  }
};

// ============================
// 3. Approve / Reject by Instructor
// ============================
const approveByInstructor = async (req, res) => {
  const { enrollmentId, action, instructor_id } = req.body;

  try {
    // 1. Fetch enrollment + course info
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        status,
        course:courses (
          faculty_id
        )
      `)
      .eq('enrollment_id', enrollmentId)
      .single();

    if (error || !enrollment) {
      return res.status(404).json({ error: "Enrollment record not found." });
    }

    // 2. Ownership check
    if (enrollment.course.faculty_id !== instructor_id) {
      return res.status(403).json({
        error: "Unauthorized. You are not the instructor for this course."
      });
    }

    // 3. Lock invalid transitions
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
        ? 'PENDING_ADVISOR_APPROVAL'
        : 'INSTRUCTOR_REJECTED';

    // 5. Update enrollment
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ status: newStatus })
      .eq('enrollment_id', enrollmentId);

    if (updateError) throw updateError;

    res.status(200).json({
      message: "Instructor decision updated successfully.",
      status: newStatus
    });
  } catch (err) {
    console.error("INSTRUCTOR APPROVAL ERROR:", err);
    res.status(500).json({ error: "Failed to process instructor decision." });
  }
};

// ============================
// 4. Float a course (NEW)
// ============================
const floatCourse = async (req, res) => {
  const {
    course_code,
    title,
    department,
    acad_session,
    capacity,
    advisor_id,
    instructor_id
  } = req.body;

  try {
    const { error } = await supabase
      .from('courses')
      .insert([
        {
          course_code,
          title,
          department,
          acad_session,
          capacity,
          faculty_id: instructor_id,
          advisor_id,
          status: 'PENDING_ADVISOR_APPROVAL',
          enrolled_count: 0
        }
      ]);

    if (error) throw error;

    res.status(201).json({
      message: "Course floated successfully. Waiting for advisor approval."
    });
  } catch (err) {
    console.error("FLOAT COURSE ERROR:", err);
    res.status(500).json({ error: "Failed to float course." });
  }
};

module.exports = {
  getCourseApplications,
  awardGrade,
  approveByInstructor,
  floatCourse
};
