const supabase = require('../supabaseClient');

exports.searchCourses = async (req, res) => {
  const { code, dept, session, title, instructor } = req.query;

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
        users (
          full_name,
          email
        )
      `);

    if (dept) query = query.ilike('department', `%${dept}%`);
    if (session) query = query.eq('acad_session', session);
    if (code) query = query.ilike('course_code', `%${code}%`);
    if (title) query = query.ilike('title', `%${title}%`);

    const { data } = await query;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Search failed." });
  }
};
