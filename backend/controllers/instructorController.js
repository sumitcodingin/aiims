const supabase = require("../supabaseClient");


// ===================================================
// 1. Get COURSES offered by instructor
// ===================================================
const getInstructorCourses = async (req, res) => {
  const { instructor_id } = req.query;

  try {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        course_id,
        course_code,
        title,
        acad_session,
        status,
        credits  // 🚀 Added credits to selection (optional, but good for display)
      `)
      .eq("faculty_id", instructor_id);

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("GET INSTRUCTOR COURSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch instructor courses." });
  }
};


// ===================================================
// 2. Get PENDING applications for a selected course
// ===================================================
const getCourseApplications = async (req, res) => {
  const { course_id } = req.query;

  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        enrollment_id,
        status,
        student:users (
          user_id,
          full_name,
          email,
          department
        )
      `)
      .eq("course_id", course_id)
      .eq("status", "PENDING_INSTRUCTOR_APPROVAL");

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("GET COURSE APPLICATIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch applications." });
  }
};


// ===================================================
// 3. Approve / Reject enrollment (INSTRUCTOR)
// ===================================================
const approveByInstructor = async (req, res) => {
  const { enrollmentId, action, instructor_id } = req.body;

  try {
    // Fetch enrollment + course
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .select(`
        status,
        course:courses (
          faculty_id
        )
      `)
      .eq("enrollment_id", enrollmentId)
      .single();

    if (error || !enrollment) {
      return res.status(404).json({ error: "Enrollment not found." });
    }

    // Ownership check
    if (enrollment.course.faculty_id !== instructor_id) {
      return res.status(403).json({ error: "Unauthorized instructor." });
    }

    if (enrollment.status !== "PENDING_INSTRUCTOR_APPROVAL") {
      return res.status(400).json({ error: "Invalid enrollment state." });
    }

    const newStatus =
      action === "ACCEPT"
        ? "PENDING_ADVISOR_APPROVAL"
        : "INSTRUCTOR_REJECTED";

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ status: newStatus })
      .eq("enrollment_id", enrollmentId);

    if (updateError) throw updateError;

    res.status(200).json({
      message: "Instructor decision recorded.",
      status: newStatus,
    });
  } catch (err) {
    console.error("INSTRUCTOR APPROVAL ERROR:", err);
    res.status(500).json({ error: "Approval failed." });
  }
};


// ===================================================
// 4. Award Grade (ONLY AFTER ENROLLED)
// ===================================================
const awardGrade = async (req, res) => {
  const { enrollmentId, grade } = req.body;

  try {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("enrollment_id", enrollmentId)
      .single();

    if (!enrollment || enrollment.status !== "ENROLLED") {
      return res.status(400).json({
        error: "Grade can be awarded only to enrolled students.",
      });
    }

    const { error } = await supabase
      .from("enrollments")
      .update({ grade })
      .eq("enrollment_id", enrollmentId);

    if (error) throw error;

    res.status(200).json({ message: "Grade awarded successfully." });
  } catch (err) {
    console.error("AWARD GRADE ERROR:", err);
    res.status(500).json({ error: "Failed to award grade." });
  }
};


// ===================================================
// 5. Float a Course (INSTRUCTOR)
// ===================================================
const floatCourse = async (req, res) => {
  const {
    course_code,
    title,
    department,
    acad_session,
    credits,  // 🚀 Get credits from request
    capacity,
    advisor_id,
    instructor_id,
  } = req.body;

  try {
    const { error } = await supabase.from("courses").insert([
      {
        course_code,
        title,
        department,
        acad_session,
        credits, // 🚀 Save to database column
        capacity,
        faculty_id: instructor_id,
        advisor_id,
        status: "PENDING_ADVISOR_APPROVAL",
        enrolled_count: 0,
      },
    ]);

    if (error) throw error;

    res.status(201).json({
      message: "Course floated successfully. Awaiting advisor approval.",
    });
  } catch (err) {
    console.error("FLOAT COURSE ERROR:", err);
    res.status(500).json({ error: "Failed to float course." });
  }
};


// ===================================================
// EXPORTS
// ===================================================
module.exports = {
  getInstructorCourses,
  getCourseApplications,
  approveByInstructor,
  awardGrade,
  floatCourse,
};