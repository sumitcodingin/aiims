const supabase = require('../supabaseClient');

// ============================
// 1. Search Courses (STUDENTS)
// ============================
exports.searchCourses = async (req, res) => {
  const { code, dept, session, title } = req.query;

  try {
    let query = supabase
      .from('courses')
      .select(`
        course_id,
        course_code,
        title,
        department,
        acad_session,
        capacity,
        enrolled_count,
        instructor:users!courses_faculty_id_fkey (
          full_name,
          email
        )
      `)
      // Students see ONLY approved courses
      .eq('status', 'APPROVED');

    // STRING FILTERS ONLY
    if (dept) query = query.ilike('department', `%${dept}%`);
    if (session) query = query.eq('acad_session', session);
    if (code) query = query.ilike('course_code', `%${code}%`);
    if (title) query = query.ilike('title', `%${title}%`);

    const { data, error } = await query;

    if (error) {
      console.error("COURSE SEARCH ERROR:", error);
      return res.status(500).json({ error: "Search failed." });
    }

    // 🔒 FILTER OUT FULL COURSES SAFELY
    const availableCourses = data.filter(
      (c) => c.enrolled_count < c.capacity
    );

    res.status(200).json(availableCourses);
  } catch (err) {
    console.error("SEARCH COURSES ERROR:", err);
    res.status(500).json({ error: "Search failed." });
  }
};

// ============================
// 2. Get Course Members (ENROLLED ONLY)
// ============================
exports.getCourseMembers = async (req, res) => {
  const { courseId } = req.params;

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        enrollment_id,
        grade,
        student:users (
          full_name,
          email,
          department,
          student_profile (
            batch,
            entry_no
          )
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'ENROLLED');

    if (error) throw error;

    res.status(200).json({
      course_id: courseId,
      total_members: data.length,
      members: data,
    });
  } catch (err) {
    console.error("GET COURSE MEMBERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch course members." });
  }
};
