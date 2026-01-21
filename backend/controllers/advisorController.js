const supabase = require("../supabaseClient");
const { sendStatusEmail } = require('../utils/sendEmail');

/* ===================================================
   Helper: Update Course Enrolled Count
   (Recalculates count to ensure DB is always correct)
=================================================== */
const updateCourseEnrolledCount = async (course_id) => {
  try {
    const { count, error } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", course_id)
      .eq("status", "ENROLLED");

    if (!error) {
      await supabase
        .from("courses")
        .update({ enrolled_count: count })
        .eq("course_id", course_id);
    }
  } catch (err) {
    console.error("Failed to update course count:", err);
  }
};

/* ===================================================
   1. Advisor approves / rejects STUDENT enrollment
=================================================== */
exports.approveByAdvisor = async (req, res) => {
  const { enrollmentId, action, advisor_id } = req.body;

  try {
    const { data: advisor } = await supabase.from("users").select("department").eq("user_id", advisor_id).single();
    if (!advisor) return res.status(404).json({ error: "Advisor not found." });

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select(`
        status, course_id,
        student:users!student_id ( full_name, email, department ),
        course:courses ( title, course_code )
      `)
      .eq("enrollment_id", enrollmentId)
      .single();

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found." });
    if (enrollment.status !== "PENDING_ADVISOR_APPROVAL") return res.status(400).json({ error: "Not pending advisor approval." });
    if (enrollment.student.department !== advisor.department) return res.status(403).json({ error: "Student not from your department." });

    const newStatus = action === "ACCEPT" ? "ENROLLED" : "ADVISOR_REJECTED";

    // 1. Update Status
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ status: newStatus })
      .eq("enrollment_id", enrollmentId);
    
    if (updateError) throw updateError;

    // 2. 🚀 UPDATE DATABASE COUNT (If Approved)
    if (newStatus === "ENROLLED") {
      await updateCourseEnrolledCount(enrollment.course_id);
    }

    // 3. Send Email
    if (enrollment.student && enrollment.course) {
      await sendStatusEmail(enrollment.student.email, enrollment.student.full_name, enrollment.course.title, newStatus);
    }

    res.json({ message: "Advisor decision recorded.", status: newStatus });
  } catch (err) {
    console.error("ADVISOR APPROVAL ERROR:", err);
    res.status(500).json({ error: "Advisor approval failed." });
  }
};

/* ===================================================
   2. Get COURSES (Advisor) - FILTERED BY DEPT & LIVE COUNTS
=================================================== */
exports.getAdvisorCourses = async (req, res) => {
  const { advisor_id } = req.query;

  try {
    const { data: advisor } = await supabase
      .from("users")
      .select("department")
      .eq("user_id", advisor_id)
      .single();

    if (!advisor) return res.status(404).json({ error: "Advisor not found." });

    // A. Get pending enrollments
    const { data } = await supabase
      .from("enrollments")
      .select(`
        course:courses (
          course_id,
          course_code,
          title,
          department,
          acad_session, 
          capacity
        ),
        student:users!student_id (
          department
        )
      `)
      .eq("status", "PENDING_ADVISOR_APPROVAL");

    // B. Filter courses relevant to advisor's department
    const uniqueCourses = {};
    (data || []).forEach((row) => {
      // 🚀 UPDATED LOGIC:
      // 1. Student must be from Advisor's department (Existing rule)
      // 2. Course must ALSO be from Advisor's department (New rule)
      if (
        row.student && 
        row.student.department === advisor.department &&
        row.course &&
        row.course.department === advisor.department // <--- Added Filter
      ) {
        uniqueCourses[row.course.course_id] = row.course;
      }
    });

    const coursesList = Object.values(uniqueCourses);

    if (coursesList.length === 0) {
      return res.json([]);
    }

    // C. FETCH LIVE ENROLLED COUNTS
    const courseIds = coursesList.map(c => c.course_id);
    const { data: enrollments, error: countError } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("status", "ENROLLED");

    if (countError) throw countError;

    const countMap = {};
    enrollments.forEach(e => {
      countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
    });

    // D. Attach counts
    const coursesWithCount = coursesList.map(c => ({
      ...c,
      enrolled_count: countMap[c.course_id] || 0
    }));

    res.json(coursesWithCount);
  } catch (err) {
    console.error("GET ADVISOR COURSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch courses." });
  }
};

/* ===================================================
   3. Get STUDENTS (Advisor)
=================================================== */
exports.getPendingStudentsForCourse = async (req, res) => {
  const { advisor_id, course_id } = req.query;

  try {
    const { data: advisor } = await supabase.from("users").select("department").eq("user_id", advisor_id).single();
    if (!advisor) return res.status(404).json({ error: "Advisor not found." });

    const { data } = await supabase
      .from("enrollments")
      .select(`
        enrollment_id, status,
        student:users!student_id ( user_id, full_name, email, department )
      `)
      .eq("course_id", course_id)
      .eq("status", "PENDING_ADVISOR_APPROVAL");

    const filtered = (data || []).filter(e => e.student && e.student.department === advisor.department);
    res.json(filtered);
  } catch (err) {
    console.error("GET ADVISOR STUDENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch students." });
  }
};

/* ===================================================
   4. Approve Course (Floated)
=================================================== */
exports.approveCourse = async (req, res) => {
  const { course_id, action, advisor_id } = req.body;
  try {
    const { data: advisor } = await supabase.from("users").select("department").eq("user_id", advisor_id).single();
    if (!advisor) return res.status(404).json({ error: "Advisor not found." });
    
    const { data: course } = await supabase.from("courses").select("department, status").eq("course_id", course_id).single();
    if (!course) return res.status(404).json({ error: "Course not found." });
    if (course.department !== advisor.department) return res.status(403).json({ error: "Unauthorized." });
    if (course.status !== "PENDING_ADVISOR_APPROVAL") return res.status(400).json({ error: "Already finalized." });

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    await supabase.from("courses").update({ status: newStatus }).eq("course_id", course_id);
    res.json({ message: `Course ${newStatus.toLowerCase()} successfully.` });
  } catch (err) {
    console.error("COURSE APPROVAL ERROR:", err);
    res.status(500).json({ error: "Course approval failed." });
  }
};

/* ===================================================
   5. Get Pending Floated Courses
=================================================== */
exports.getPendingCourses = async (req, res) => {
  const { advisor_id } = req.query;
  try {
    const { data: advisor } = await supabase.from("users").select("department").eq("user_id", advisor_id).single();
    if (!advisor) return res.status(404).json({ error: "Advisor not found." });

    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        course_id, course_code, title, acad_session, capacity, department, status,
        instructor:users!faculty_id ( full_name, email )
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