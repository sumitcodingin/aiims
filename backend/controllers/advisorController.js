const supabase = require("../supabaseClient");
const { sendCustomEmail } = require("../utils/sendCustomEmail");
const { sendStatusEmail } = require('../utils/sendEmail');

/* ===================================================
   Helper: Update Course Enrolled Count
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
   SECTION 1: COURSE APPROVALS (Instructor -> Advisor)
=================================================== */

// A. Get Floated Courses (Pending AND Approved)
exports.getFloatedCourses = async (req, res) => {
  const { advisor_id } = req.query;
  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        course_id, course_code, title, acad_session, capacity, department, status, credits,
        instructor:users!faculty_id ( full_name, email )
      `)
      .eq("advisor_id", advisor_id) // Strict check: Only courses assigned to me
      // Show PENDING, APPROVED, and REJECTED so advisor can see all history
      .in("status", ["PENDING_ADVISOR_APPROVAL", "APPROVED", "REJECTED"]);

    if (error) throw error;
    res.json(courses || []);
  } catch (err) {
    console.error("GET FLOATED COURSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch courses." });
  }
};

// B. Approve / Reject Floated Course
exports.approveCourse = async (req, res) => {
  const { course_id, action, advisor_id } = req.body;
  
  try {
    // 1. Fetch the course to verify ownership
    const { data: course } = await supabase
      .from("courses")
      .select("advisor_id, status")
      .eq("course_id", course_id)
      .single();

    if (!course) return res.status(404).json({ error: "Course not found." });

    // 2. Strict Security Check: Ensure the logged-in advisor owns this course request
    if (String(course.advisor_id) !== String(advisor_id)) {
      return res.status(403).json({ error: "Unauthorized: You are not the advisor for this instructor." });
    }

    // 3. Determine New Status
    let newStatus = "";
    if (action === "APPROVE") {
        newStatus = "APPROVED";
    } else if (action === "REJECT") {
        newStatus = "REJECTED";
    } else {
        return res.status(400).json({ error: "Invalid action. Use APPROVE or REJECT." });
    }

    // 4. Update Database
    const { error } = await supabase
      .from("courses")
      .update({ status: newStatus })
      .eq("course_id", course_id);
    
    if (error) throw error;
    
    res.json({ message: `Course status updated to ${newStatus}.`, status: newStatus });
  } catch (err) {
    console.error("COURSE APPROVAL ERROR:", err);
    res.status(500).json({ error: "Course approval failed." });
  }
};

/* ===================================================
   SECTION 2: STUDENT APPROVALS (Student -> Advisor)
=================================================== */

// A. Get "Union" of Courses
exports.getAdvisorStudentCourses = async (req, res) => {
  const { advisor_id } = req.query;

  try {
    const { data } = await supabase
      .from("enrollments")
      .select(`
        status,
        course:courses (
          course_id, course_code, title, department, acad_session, capacity
        ),
        student:users!student_id ( advisor_id )
      `)
      .in("status", ["PENDING_ADVISOR_APPROVAL", "ENROLLED"]);

    const uniqueCourses = {};
    const countMap = {};

    (data || []).forEach((row) => {
      // Filter strictly for students assigned to this advisor
      if (row.student && String(row.student.advisor_id) === String(advisor_id) && row.course) {
        uniqueCourses[row.course.course_id] = row.course;
      }
    });

    const coursesList = Object.values(uniqueCourses);
    if (coursesList.length === 0) return res.json([]);

    const courseIds = coursesList.map(c => c.course_id);
    const { data: allEnrolled } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("status", "ENROLLED");

    (allEnrolled || []).forEach(e => {
      countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
    });

    res.json(coursesList.map(c => ({ 
      ...c, 
      enrolled_count: countMap[c.course_id] || 0 
    })));

  } catch (err) {
    console.error("GET STUDENT COURSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch courses." });
  }
};

// B. Get Students for a specific Course Card
exports.getAdvisorStudentsForCourse = async (req, res) => {
  const { advisor_id, course_id } = req.query;
  try {
    const { data } = await supabase
      .from("enrollments")
      .select(`
        enrollment_id, status,
        student:users!student_id ( user_id, full_name, email, department, advisor_id )
      `)
      .eq("course_id", course_id)
      .in("status", ["PENDING_ADVISOR_APPROVAL", "ENROLLED"]);

    const myStudents = (data || []).filter(e => 
      e.student && String(e.student.advisor_id) === String(advisor_id)
    );

    res.json(myStudents);
  } catch (err) {
    console.error("GET COURSE STUDENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch students." });
  }
};

// C. Approve / Reject / Remove Student
exports.approveByAdvisor = async (req, res) => {
  const { enrollmentId, action, advisor_id } = req.body;

  try {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select(`
        status, course_id,
        student:users!student_id ( user_id, full_name, email, department, advisor_id ),
        course:courses ( title, course_code )
      `)
      .eq("enrollment_id", enrollmentId)
      .single();

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found." });

    if (String(enrollment.student.advisor_id) !== String(advisor_id)) {
      return res.status(403).json({ error: "You are not this student's advisor." });
    }

    if (action === "REMOVE" && enrollment.status !== "ENROLLED") {
      return res.status(400).json({ error: "Can only remove enrolled students." });
    }

    let newStatus = "";
    if (action === "ACCEPT") newStatus = "ENROLLED";
    else if (action === "REJECT") newStatus = "ADVISOR_REJECTED";
    else if (action === "REMOVE") newStatus = "ADVISOR_REJECTED"; 

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ status: newStatus })
      .eq("enrollment_id", enrollmentId);
    
    if (updateError) throw updateError;

    if (newStatus === "ENROLLED" || action === "REMOVE") {
      await updateCourseEnrolledCount(enrollment.course_id);
    }

    if (enrollment.student && enrollment.course) {
      await sendStatusEmail(
        enrollment.student.email, 
        enrollment.student.full_name, 
        enrollment.course.title, 
        newStatus
      );
    }

    res.json({ message: action === "REMOVE" ? "Student removed." : "Decision recorded.", status: newStatus });
  } catch (err) {
    console.error("ADVISOR ACTION ERROR:", err);
    res.status(500).json({ error: "Action failed." });
  }
};

// ==============================
// GET ALL STUDENTS UNDER ADVISOR
// ==============================
// ==========================================
// GET ALL STUDENTS UNDER AN ADVISOR (LIST)
// ==========================================
exports.getAllAdvisorStudents = async (req, res) => {
  const { advisor_id } = req.query;

  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        user_id,
        full_name,
        email,
        department,
        account_status,
        student_profile (
          entry_no,
          batch
        )
      `)
      .eq("advisor_id", advisor_id)
      .eq("role", "Student");

    if (error) throw error;

    // Normalize response
    const students = (data || []).map(s => ({
      user_id: s.user_id,
      full_name: s.full_name,
      email: s.email,
      department: s.department,
      account_status: s.account_status,
      entry_no: s.student_profile?.entry_no || null,
      batch: s.student_profile?.batch || null
    }));

    res.json(students);
  } catch (err) {
    console.error("GET ALL ADVISOR STUDENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch students." });
  }
};
// ==================================================
// GET FULL STUDENT DETAILS + COURSE HISTORY
// ==================================================
// ==================================================
// GET FULL STUDENT DETAILS + COURSE HISTORY (FINAL)
// ==================================================
exports.getAdvisorStudentDetails = async (req, res) => {
  const { advisor_id, student_id } = req.query;

  try {
    /* ============================
       1️⃣ FETCH STUDENT BASIC INFO
    ============================ */
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select(`
        user_id,
        full_name,
        email,
        department,
        advisor_id,
        role,
        student_profile (
          entry_no,
          batch
        )
      `)
      .eq("user_id", student_id)
      .eq("role", "Student")
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: "Student not found." });
    }

    // 🔐 Advisor ownership check
    if (String(student.advisor_id) !== String(advisor_id)) {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    /* ============================
       2️⃣ FETCH ENROLLMENTS ONLY
    ============================ */
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select(`
        enrollment_id,
        course_id,
        status,
        grade,
        updated_at
      `)
      .eq("student_id", student_id)
      .order("updated_at", { ascending: false });

    if (enrollError) throw enrollError;

    if (!enrollments || enrollments.length === 0) {
      return res.json({
        student: {
          user_id: student.user_id,
          full_name: student.full_name,
          email: student.email,
          department: student.department,
          entry_no: student.student_profile?.entry_no || null,
          batch: student.student_profile?.batch || null,
          role: student.role
        },
        courses: []
      });
    }

    /* ============================
       3️⃣ FETCH COURSES SEPARATELY
    ============================ */
    const courseIds = enrollments.map(e => e.course_id);

    const { data: courses, error: courseError } = await supabase
      .from("courses")
      .select(`
        course_id,
        course_code,
        title,
        acad_session,
        credits
      `)
      .in("course_id", courseIds);

    if (courseError) throw courseError;

    /* ============================
       4️⃣ MERGE DATA MANUALLY
    ============================ */
    const courseMap = {};
    (courses || []).forEach(c => {
      courseMap[c.course_id] = c;
    });

    const merged = enrollments.map(e => ({
      enrollment_id: e.enrollment_id,
      status: e.status,
      grade: e.grade,
      updated_at: e.updated_at,
      course: courseMap[e.course_id] || null
    }));

    /* ============================
       5️⃣ RESPONSE
    ============================ */
    res.json({
      student: {
        user_id: student.user_id,
        full_name: student.full_name,
        email: student.email,
        department: student.department,
        entry_no: student.student_profile?.entry_no || null,
        batch: student.student_profile?.batch || null,
        role: student.role
      },
      courses: merged
    });

  } catch (err) {
    console.error("GET STUDENT DETAILS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch student details." });
  }
};
exports.sendEmailToStudent = async (req, res) => {
  const { advisor_id, to, subject, message, cc = [], bcc = [] } = req.body;

  if (!advisor_id || !to || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // 🔐 Verify advisor
    const { data: advisor, error } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", advisor_id)
      .eq("role", "Advisor")
      .single();

    if (error || !advisor) {
      return res.status(403).json({ error: "Unauthorized advisor." });
    }

    // 📧 Send email
    await sendCustomEmail({
      to,
      subject,
      text: message,
      cc,
      bcc,
    });

    res.json({ message: "Email sent successfully." });

  } catch (err) {
    console.error("SEND EMAIL ERROR:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
};
