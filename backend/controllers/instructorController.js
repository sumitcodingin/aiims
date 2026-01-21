const supabase = require("../supabaseClient");
const { sendStatusEmail } = require('../utils/sendEmail');

/* ===================================================
   Helper: Update Course Enrolled Count
   (Counts real enrollments and updates the courses table)
=================================================== */
const updateCourseEnrolledCount = async (course_id) => {
  try {
    // 1. Count exact number of ENROLLED students
    const { count, error } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", course_id)
      .eq("status", "ENROLLED");

    if (!error) {
      // 2. Write this number to the courses table
      await supabase
        .from("courses")
        .update({ enrolled_count: count })
        .eq("course_id", course_id);
      console.log(`Synced course ${course_id} count to ${count}`);
    }
  } catch (err) {
    console.error("Failed to update course count:", err);
  }
};

// ===================================================
// 1. Get COURSES (With LIVE Count Calculation)
// ===================================================
const getInstructorCourses = async (req, res) => {
  const { instructor_id } = req.query;

  try {
    // A. Fetch the courses
    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        course_id,
        course_code,
        title,
        acad_session,
        status,
        credits,
        department,
        capacity
      `)
      .eq("faculty_id", instructor_id);

    if (error) throw error;
    if (!courses || courses.length === 0) return res.status(200).json([]);

    // B. Fetch the LIVE count of 'ENROLLED' students for these courses
    const courseIds = courses.map((c) => c.course_id);
    const { data: enrollments, error: countError } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("status", "ENROLLED");

    if (countError) throw countError;

    // C. Calculate counts in memory
    const countMap = {};
    enrollments.forEach((e) => {
      countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
    });

    // D. Attach the REAL count to the course objects
    const coursesWithCount = courses.map((c) => ({
      ...c,
      enrolled_count: countMap[c.course_id] || 0, // <--- Displays real data
    }));

    res.status(200).json(coursesWithCount);
  } catch (err) {
    console.error("GET INSTRUCTOR COURSES ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch instructor courses.",
    });
  }
};

// ===================================================
// 2. Get Applications AND Enrolled Students
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
      .in("status", ["PENDING_INSTRUCTOR_APPROVAL", "ENROLLED"]);

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("GET COURSE APPLICATIONS ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch applications.",
    });
  }
};

// ===================================================
// 3. Approve / Reject / Remove Student
// ===================================================
const approveByInstructor = async (req, res) => {
  const { enrollmentId, action, instructor_id } = req.body;

  try {
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .select(`
        status,
        course_id,
        course:courses (
          faculty_id,
          title,
          course_code
        ),
        student:users (
          full_name,
          email
        )
      `)
      .eq("enrollment_id", enrollmentId)
      .single();

    if (error || !enrollment) {
      return res.status(404).json({ error: "Enrollment not found." });
    }

    if (enrollment.course.faculty_id !== instructor_id) {
      return res.status(403).json({ error: "Unauthorized instructor." });
    }

    let newStatus = "";
    let wasEnrolled = false;

    // Logic: Remove vs Application Decision
    if (action === "REMOVE") {
      if (enrollment.status !== "ENROLLED") {
        return res.status(400).json({ error: "Only enrolled students can be removed." });
      }
      newStatus = "INSTRUCTOR_REJECTED";
      wasEnrolled = true;
    } else {
      if (enrollment.status !== "PENDING_INSTRUCTOR_APPROVAL") {
        return res.status(400).json({ error: "Invalid state for approval." });
      }
      newStatus =
        action === "ACCEPT"
          ? "PENDING_ADVISOR_APPROVAL"
          : "INSTRUCTOR_REJECTED";
    }

    // 1. Update Status
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ status: newStatus })
      .eq("enrollment_id", enrollmentId);

    if (updateError) throw updateError;

    // 2. 🚀 UPDATE DATABASE COUNT (Only if we removed an enrolled student)
    if (wasEnrolled) {
      await updateCourseEnrolledCount(enrollment.course_id);
    }

    // 3. Send Email
    if (enrollment.student && enrollment.course) {
      await sendStatusEmail(
        enrollment.student.email,
        enrollment.student.full_name,
        enrollment.course.title,
        newStatus
      );
    }

    res.status(200).json({
      message: action === "REMOVE" ? "Student removed." : "Decision recorded.",
      status: newStatus,
    });
  } catch (err) {
    console.error("INSTRUCTOR ACTION ERROR:", err);
    res.status(500).json({ error: "Action failed." });
  }
};

// ===================================================
// 4. Award Grade
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
// 5. Float a Course
// ===================================================
const floatCourse = async (req, res) => {
  const {
    course_code,
    title,
    department,
    acad_session,
    credits,
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
        credits,
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
// 6. Get Anonymous Feedback
// ===================================================
const getInstructorFeedback = async (req, res) => {
  const { instructor_id, course_id, feedback_type } = req.query;

  if (!instructor_id) {
    return res.status(400).json({ error: "instructor_id is required." });
  }

  try {
    let query = supabase
      .from("course_instructor_feedback")
      .select(
        `
          feedback_id,
          course_id,
          instructor_id,
          feedback_type,
          q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,
          created_at,
          course:courses (
            course_code,
            title,
            acad_session
          )
        `
      )
      .eq("instructor_id", instructor_id)
      .order("created_at", { ascending: false });

    if (course_id) query = query.eq("course_id", course_id);
    if (feedback_type) query = query.eq("feedback_type", feedback_type);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("GET INSTRUCTOR FEEDBACK ERROR:", err);
    res.status(500).json({ error: "Failed to fetch feedback." });
  }
};

module.exports = {
  getInstructorCourses,
  getCourseApplications,
  approveByInstructor,
  awardGrade,
  floatCourse,
  getInstructorFeedback,
};