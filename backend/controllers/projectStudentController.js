const supabase = require("../supabaseClient");

/* ===================================================
   1. Browse Institute Public Projects
=================================================== */
const browseProjects = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        project_id, title, summary, domain,
        student_mode, student_slots,
        duration, weekly_commitment,
        required_skills, expected_outcomes,
        instructor:users ( full_name, department )
      `)
      .eq("visibility", "INSTITUTE_PUBLIC")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("BROWSE PROJECTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
};

/* ===================================================
   2. Send Request to Join Project
=================================================== */
const requestToJoinProject = async (req, res) => {
  const student_id = req.user.user_id;
  const { project_id, message } = req.body;

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select("student_mode, student_slots")
      .eq("project_id", project_id)
      .single();

    if (error || !project)
      return res.status(404).json({ error: "Project not found." });

    if (project.student_mode === "NO_STUDENTS")
      return res.status(403).json({ error: "This project is not accepting students." });

    if (
      project.student_mode === "LIMITED_SLOTS" &&
      project.student_slots <= 0
    ) {
      return res.status(403).json({ error: "No slots available." });
    }

    const { error: insertError } = await supabase
      .from("project_requests")
      .insert([{ project_id, student_id, message }]);

    if (insertError) throw insertError;

    res.status(201).json({ message: "Request sent successfully." });
  } catch (err) {
    console.error("PROJECT REQUEST ERROR:", err);
    res.status(500).json({ error: "Failed to send request." });
  }
};

/* ===================================================
   EXPORTS
=================================================== */
module.exports = {
  browseProjects,
  requestToJoinProject
};
