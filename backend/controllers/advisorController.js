const supabase = require("../supabaseClient");

/* ===================================================
   1. Advisor approves / rejects STUDENT enrollment
=================================================== */
exports.approveByAdvisor = async (req, res) => {
  const { enrollmentId, action, advisor_id } = req.body;

  try {
    // Advisor department
    const { data: advisor } = await supabase
      .from("users")
      .select("department")
      .eq("user_id", advisor_id)
      .single();

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    // Enrollment + student
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select(`
        status,
        student:users!student_id (
          department
        )
      `)
      .eq("enrollment_id", enrollmentId)
      .single();

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found." });
    }

    if (enrollment.status !== "PENDING_ADVISOR_APPROVAL") {
      return res.status(400).json({
        error: "Enrollment not ready for advisor approval."
      });
    }

    if (enrollment.student.department !== advisor.department) {
      return res.status(403).json({
        error: "Student not from your department."
      });
    }

    const newStatus =
      action === "ACCEPT" ? "ENROLLED" : "ADVISOR_REJECTED";

    await supabase
      .from("enrollments")
      .update({ status: newStatus })
      .eq("enrollment_id", enrollmentId);

    res.json({
      message: "Advisor decision recorded.",
      status: newStatus
    });
  } catch (err) {
    console.error("ADVISOR APPROVAL ERROR:", err);
    res.status(500).json({ error: "Advisor approval failed." });
  }
};

/* ===================================================
   2. Get COURSES that have students pending advisor approval
=================================================== */
exports.getAdvisorCourses = async (req, res) => {
  const { advisor_id } = req.query;

  try {
    const { data: advisor } = await supabase
      .from("users")
      .select("department")
      .eq("user_id", advisor_id)
      .single();

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    const { data } = await supabase
      .from("enrollments")
      .select(`
        course:courses (
          course_id,
          course_code,
          title,
          department
        ),
        student:users!student_id (
          department
        )
      `)
      .eq("status", "PENDING_ADVISOR_APPROVAL");

    // Filter in JS (IMPORTANT)
    const uniqueCourses = {};
    data.forEach((row) => {
      if (row.student.department === advisor.department) {
        uniqueCourses[row.course.course_id] = row.course;
      }
    });

    res.json(Object.values(uniqueCourses));
  } catch (err) {
    console.error("GET ADVISOR COURSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch courses." });
  }
};

/* ===================================================
   3. Get STUDENTS pending advisor approval (course-wise)
=================================================== */
exports.getPendingStudentsForCourse = async (req, res) => {
  const { advisor_id, course_id } = req.query;

  try {
    const { data: advisor } = await supabase
      .from("users")
      .select("department")
      .eq("user_id", advisor_id)
      .single();

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    const { data } = await supabase
      .from("enrollments")
      .select(`
        enrollment_id,
        status,
        student:users!student_id (
          user_id,
          full_name,
          email,
          department
        )
      `)
      .eq("course_id", course_id)
      .eq("status", "PENDING_ADVISOR_APPROVAL");

    // Filter by department in JS
    const filtered = data.filter(
      (e) => e.student.department === advisor.department
    );

    res.json(filtered);
  } catch (err) {
    console.error("GET ADVISOR STUDENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch students." });
  }
};

/* ===================================================
   4. Advisor approves / rejects FLOATED COURSE
=================================================== */
exports.approveCourse = async (req, res) => {
  const { course_id, action, advisor_id } = req.body;

  try {
    const { data: advisor } = await supabase
      .from("users")
      .select("department")
      .eq("user_id", advisor_id)
      .single();

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("department, status")
      .eq("course_id", course_id)
      .single();

    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    if (course.department !== advisor.department) {
      return res.status(403).json({
        error: "Unauthorized course approval."
      });
    }

    if (course.status !== "PENDING_ADVISOR_APPROVAL") {
      return res.status(400).json({
        error: "Course already finalized."
      });
    }

    const newStatus =
      action === "APPROVE" ? "APPROVED" : "REJECTED";

    await supabase
      .from("courses")
      .update({ status: newStatus })
      .eq("course_id", course_id);

    res.json({
      message: `Course ${newStatus.toLowerCase()} successfully.`
    });
  } catch (err) {
    console.error("COURSE APPROVAL ERROR:", err);
    res.status(500).json({ error: "Course approval failed." });
  }
};

/* ===================================================
   5. Get FLOATED COURSES pending advisor approval
=================================================== */
exports.getPendingCourses = async (req, res) => {
  const { advisor_id } = req.query;

  try {
    // 1. Identify the advisor's department to filter relevant courses
    const { data: advisor } = await supabase
      .from("users")
      .select("department")
      .eq("user_id", advisor_id)
      .single();

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    // 2. Fetch courses in the advisor's department with PENDING_ADVISOR_APPROVAL status
    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        course_id,
        course_code,
        title,
        acad_session,
        capacity,
        department,
        status,
        instructor:users!faculty_id (
          full_name,
          email
        )
      `)
      .eq("department", advisor.department)
      .eq("status", "PENDING_ADVISOR_APPROVAL");

    if (error) throw error;

    res.json(courses || []);
  } catch (err) {
    console.error("GET PENDING COURSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch pending courses." });
  }
};
