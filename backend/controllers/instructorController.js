const supabase = require("../supabaseClient");
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

// ===================================================
// 1. Get COURSES (Standard)
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
        capacity,
        slot
      `)
      .eq("faculty_id", instructor_id);

    if (error) throw error;
    if (!courses || courses.length === 0) return res.status(200).json([]);

    // B. Fetch the LIVE count of 'ENROLLED' students
    const courseIds = courses.map((c) => c.course_id);
    const { data: enrollments, error: countError } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("status", "ENROLLED");

    if (countError) throw countError;

    // C. Calculate counts
    const countMap = {};
    enrollments.forEach((e) => {
      countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
    });

    // D. Attach the REAL count
    const coursesWithCount = courses.map((c) => ({
      ...c,
      enrolled_count: countMap[c.course_id] || 0, 
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
// 2. Get Applications
// ===================================================
const getCourseApplications = async (req, res) => {
  const { course_id } = req.query;

  try {
    const { data, error } = await supabase
      .from("enrollments")
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
      .eq("course_id", course_id)
      .in("status", ["PENDING_INSTRUCTOR_APPROVAL", "ENROLLED"]);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("GET COURSE APPLICATIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch applications." });
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

    if (error || !enrollment) return res.status(404).json({ error: "Enrollment not found." });
    if (enrollment.course.faculty_id !== instructor_id) return res.status(403).json({ error: "Unauthorized." });

    let newStatus = "";
    let wasEnrolled = false;

    if (action === "REMOVE") {
      if (enrollment.status !== "ENROLLED") {
        return res.status(400).json({ error: "Only enrolled students can be removed." });
      }
      newStatus = "INSTRUCTOR_REJECTED";
      wasEnrolled = true;
    } else {
      if (enrollment.status !== "PENDING_INSTRUCTOR_APPROVAL") {
        return res.status(400).json({ error: "Invalid state." });
      }
      newStatus = action === "ACCEPT" ? "PENDING_ADVISOR_APPROVAL" : "INSTRUCTOR_REJECTED";
    }

    // 1. Update Status
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ status: newStatus })
      .eq("enrollment_id", enrollmentId);

    if (updateError) throw updateError;

    // 2. Update DB Count (If Removed)
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
  const { enrollmentId, grade, instructor_id } = req.body;

  console.log("Award Grade Request:", { enrollmentId, grade, instructor_id });

  try {
    if (!grade) {
      return res.status(400).json({ error: "Grade is required." });
    }

    // 1. Fetch enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("enrollment_id, status, course_id")
      .eq("enrollment_id", enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      return res.status(404).json({ error: "Enrollment not found.", details: enrollError });
    }

    // 2. Fetch course to verify instructor ownership
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id, faculty_id")
      .eq("course_id", enrollment.course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: "Course not found.", details: courseError });
    }

    // 3. Check if instructor owns this course
    if (String(course.faculty_id) !== String(instructor_id)) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    // 4. Check if student is enrolled
    if (enrollment.status !== "ENROLLED") {
      return res.status(400).json({ error: "Student must be enrolled." });
    }

    // 5. Update grade
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ grade })
      .eq("enrollment_id", enrollmentId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Grade awarded successfully." });
  } catch (err) {
    console.error("AWARD GRADE ERROR - Full Details:", err);
    res.status(500).json({ error: "Failed to award grade.", details: err.message });
  }
};

// ===================================================
// 5. Float a Course (UPDATED WITH SLOT LOGIC)
// ===================================================
const floatCourse = async (req, res) => {
  const {
    course_code,
    title,
    department,
    acad_session,
    credits,
    capacity,
    slot, // Added slot
    instructor_id,
  } = req.body;

  try {
    if (!slot) {
      return res.status(400).json({ error: "Course slot is required." });
    }

    // 1. 🚀 EDGE CASE 1: Check if Instructor already has a course in this slot
    // We check for the same instructor, same session, and same slot.
    const { data: existingSlotCourses, error: slotError } = await supabase
      .from("courses")
      .select("course_id")
      .eq("faculty_id", instructor_id)
      .eq("acad_session", acad_session)
      .eq("slot", slot);

    if (slotError) throw slotError;

    if (existingSlotCourses && existingSlotCourses.length > 0) {
      return res.status(400).json({ error: "You already have a course in this slot" });
    }

    // 2. Fetch the specific Advisor assigned to this Instructor
    const { data: instructorUser, error: userError } = await supabase
      .from("users")
      .select("advisor_id")
      .eq("user_id", instructor_id)
      .single();

    if (userError || !instructorUser) {
      return res.status(404).json({ error: "Instructor user not found." });
    }

    if (!instructorUser.advisor_id) {
      return res.status(400).json({ 
        error: "You do not have an assigned advisor. Please contact Admin." 
      });
    }

    // 3. Insert Course with Slot
    const { error } = await supabase.from("courses").insert([
      {
        course_code,
        title,
        department,
        acad_session,
        credits,
        capacity,
        slot, // Insert the slot
        faculty_id: instructor_id,
        advisor_id: instructorUser.advisor_id,
        status: "PENDING_ADVISOR_APPROVAL",
        enrolled_count: 0,
      },
    ]);

    if (error) throw error;

    res.status(201).json({
      message: "Course floated successfully. Sent to your assigned advisor for approval.",
    });
  } catch (err) {
    console.error("FLOAT COURSE ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to float course." });
  }
};

// ===================================================
// 6. Get Feedback
// ===================================================
const getInstructorFeedback = async (req, res) => {
  const { instructor_id, course_id, feedback_type } = req.query;
  if (!instructor_id) return res.status(400).json({ error: "instructor_id required." });
  try {
    let query = supabase.from("course_instructor_feedback").select(`*, course:courses(course_code, title)`).eq("instructor_id", instructor_id);
    if (course_id) query = query.eq("course_id", course_id);
    if (feedback_type) query = query.eq("feedback_type", feedback_type);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: "Failed to fetch feedback." }); }
};

// ===================================================
// 7. Get Enrolled Students for CSV Download
// ===================================================
const getEnrolledStudentsForCourse = async (req, res) => {
  const { course_id } = req.params;
  const { instructor_id } = req.query;

  try {
    // 1. Verify instructor owns this course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("faculty_id")
      .eq("course_id", course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Convert both to strings for comparison (type safety)
    if (String(course.faculty_id) !== String(instructor_id)) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    // 2. Fetch enrolled students with their name and email
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select(`
        student_id,
        users!inner (
          full_name,
          email
        )
      `)
      .eq("course_id", course_id)
      .eq("status", "ENROLLED");

    if (error) throw error;

    // 3. Format data for CSV: extract names and emails
    const students = enrollments.map((enrollment) => ({
      name: enrollment.users?.full_name || "N/A",
      email: enrollment.users?.email || "N/A",
    }));

    res.status(200).json(students);
  } catch (err) {
    console.error("GET ENROLLED STUDENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch enrolled students." });
  }
};

// ===================================================
// 8. Validate Grades CSV
// ===================================================
const validateGradesCSV = async (req, res) => {
  const { course_id, instructor_id, data, valid_grades } = req.body;

  console.log("Validating CSV for course:", course_id);

  try {
    // 1. Verify instructor owns this course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id, faculty_id")
      .eq("course_id", course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: "Course not found." });
    }

    if (String(course.faculty_id) !== String(instructor_id)) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    // 2. Fetch all enrolled students for this course
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select(`
        enrollment_id,
        student_id,
        users!inner (
          full_name,
          email
        )
      `)
      .eq("course_id", course_id)
      .eq("status", "ENROLLED");

    if (enrollError) throw enrollError;

    // 3. Create a map for quick lookup: email -> (name, enrollment_id)
    const studentMap = {};
    enrollments.forEach((enrollment) => {
      const email = enrollment.users?.email?.toLowerCase();
      const name = enrollment.users?.full_name;
      if (email && name) {
        if (!studentMap[email]) {
          studentMap[email] = [];
        }
        studentMap[email].push({
          name,
          enrollment_id: enrollment.enrollment_id,
        });
      }
    });

    // 4. Validate each row
    const valid_rows = [];
    const invalid_rows = [];

    data.forEach((row, idx) => {
      const rowNum = idx + 2; // +2 because 1-indexed and skip header
      let error = null;

      // Check grade validity
      if (!row.grade || !valid_grades.includes(row.grade.trim())) {
        error = `Invalid grade "${row.grade}". Must be one of: ${valid_grades.join(", ")}`;
      }

      // Check student exists
      const email = row.email?.toLowerCase();
      const name = row.name?.trim();

      if (!error && !email) {
        error = "Email is required.";
      }

      if (!error && !name) {
        error = "Student Name is required.";
      }

      if (!error && !studentMap[email]) {
        error = `No enrolled student found with email "${row.email}".`;
      }

      if (!error) {
        // Find matching student by name and email
        const matches = studentMap[email].filter(
          (s) => s.name.toLowerCase() === name.toLowerCase()
        );

        if (matches.length === 0) {
          error = `No enrolled student found with name "${row.name}" and email "${row.email}".`;
        } else {
          valid_rows.push({
            name: row.name,
            email: row.email,
            grade: row.grade.trim(),
            enrollment_id: matches[0].enrollment_id,
          });
        }
      }

      if (error) {
        invalid_rows.push({
          row_number: rowNum,
          error,
        });
      }
    });

    res.status(200).json({
      valid_rows,
      invalid_rows,
    });
  } catch (err) {
    console.error("VALIDATE CSV ERROR:", err);
    res.status(500).json({ error: "Failed to validate CSV data." });
  }
};

// ===================================================
// 9. Submit Mass Grades
// ===================================================
const submitMassGrades = async (req, res) => {
  const { course_id, instructor_id, grades } = req.body;

  console.log("Submitting mass grades:", grades.length);

  try {
    // 1. Verify instructor owns this course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id, faculty_id")
      .eq("course_id", course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: "Course not found." });
    }

    if (String(course.faculty_id) !== String(instructor_id)) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    // 2. Update all grades
    const updatePromises = grades.map((g) =>
      supabase
        .from("enrollments")
        .update({ grade: g.grade })
        .eq("enrollment_id", g.enrollment_id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const hasErrors = results.some((r) => r.error);
    if (hasErrors) {
      throw new Error("One or more grade updates failed.");
    }

    res.status(200).json({
      message: `Successfully awarded grades to ${grades.length} student(s).`,
      count: grades.length,
    });
  } catch (err) {
    console.error("SUBMIT MASS GRADES ERROR:", err);
    res.status(500).json({ error: "Failed to submit mass grades." });
  }
};

module.exports = { 
  getInstructorCourses, 
  getCourseApplications, 
  approveByInstructor, 
  awardGrade, 
  floatCourse, 
  getInstructorFeedback,
  getEnrolledStudentsForCourse,
  validateGradesCSV,
  submitMassGrades
};