const supabase = require("../supabaseClient");

/* ===================================================
   1. CREATE PROJECT
=================================================== */
const createProject = async (req, res) => {
  const instructor_id = req.user?.user_id;
  const payload = req.body;

  if (!instructor_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    title,
    summary,
    description,
    domain,
    visibility = "PRIVATE",
    student_mode = "NO_STUDENTS",
    student_slots,
    required_skills,
    preferred_background,
    expected_outcomes,
    duration,
    weekly_commitment,
  } = payload;

  /* ---------- VALIDATION ---------- */
  if (!title || !summary || !description || !domain) {
    return res.status(400).json({
      error: "title, summary, description and domain are required.",
    });
  }

  if (
    student_mode === "LIMITED_SLOTS" &&
    (student_slots === null ||
      student_slots === undefined ||
      Number(student_slots) <= 0)
  ) {
    return res.status(400).json({
      error: "Valid student_slots required for LIMITED_SLOTS mode.",
    });
  }

  try {
    const { error } = await supabase.from("projects").insert([
      {
        title,
        summary,
        description,
        domain,
        visibility,
        student_mode,
        student_slots:
          student_mode === "LIMITED_SLOTS"
            ? Number(student_slots)
            : null,
        required_skills:
          student_mode !== "NO_STUDENTS" ? required_skills : null,
        preferred_background:
          student_mode !== "NO_STUDENTS" ? preferred_background : null,
        weekly_commitment:
          student_mode !== "NO_STUDENTS" ? weekly_commitment : null,
        expected_outcomes,
        duration,
        created_by: instructor_id,
      },
    ]);

    if (error) throw error;

    res.status(201).json({ message: "Project created successfully." });
  } catch (err) {
    console.error("CREATE PROJECT ERROR:", err);
    res.status(500).json({ error: "Failed to create project." });
  }
};

/* ===================================================
   2. GET INSTRUCTOR PROJECTS
=================================================== */
const getMyProjects = async (req, res) => {
  const instructor_id = req.user?.user_id;

  if (!instructor_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("created_by", instructor_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("GET MY PROJECTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
};

/* ===================================================
   3. GET PROJECT REQUESTS
=================================================== */
const getProjectRequests = async (req, res) => {
  const instructor_id = req.user?.user_id;
  const { project_id } = req.query;

  if (!instructor_id || !project_id) {
    return res.status(400).json({ error: "Invalid request." });
  }

  try {
    // Ownership check
    const { data: project } = await supabase
      .from("projects")
      .select("created_by")
      .eq("project_id", project_id)
      .single();

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    if (project.created_by !== instructor_id) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const { data, error } = await supabase
      .from("project_requests")
      .select(`
        request_id,
        status,
        message,
        created_at,
        student:users (
          user_id,
          full_name,
          email,
          department
        )
      `)
      .eq("project_id", project_id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("GET PROJECT REQUESTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch requests." });
  }
};

/* ===================================================
   4. ACCEPT / REJECT PROJECT REQUEST
=================================================== */
const respondToProjectRequest = async (req, res) => {
  const instructor_id = req.user?.user_id;
  const { request_id, action } = req.body;

  if (!instructor_id || !request_id || !["ACCEPT", "REJECT"].includes(action)) {
    return res.status(400).json({ error: "Invalid request." });
  }

  try {
    const { data: reqData } = await supabase
      .from("project_requests")
      .select(`
        request_id,
        student_id,
        project_id,
        project:projects (
          created_by,
          student_mode,
          student_slots
        )
      `)
      .eq("request_id", request_id)
      .single();

    if (!reqData) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (reqData.project.created_by !== instructor_id) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    /* ---------- ACCEPT ---------- */
    if (action === "ACCEPT") {
      if (
        reqData.project.student_mode === "LIMITED_SLOTS" &&
        reqData.project.student_slots <= 0
      ) {
        return res.status(400).json({ error: "No slots available." });
      }

      // Prevent duplicate membership
      const { data: exists } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("project_id", reqData.project_id)
        .eq("student_id", reqData.student_id)
        .maybeSingle();

      if (!exists) {
        await supabase.from("project_members").insert([
          {
            project_id: reqData.project_id,
            student_id: reqData.student_id,
          },
        ]);
      }

      if (reqData.project.student_mode === "LIMITED_SLOTS") {
        await supabase
          .from("projects")
          .update({
            student_slots: reqData.project.student_slots - 1,
          })
          .eq("project_id", reqData.project_id);
      }
    }

    // Update request status
    await supabase
      .from("project_requests")
      .update({ status: action })
      .eq("request_id", request_id);

    res.json({
      message: `Request ${action.toLowerCase()}ed successfully.`,
    });
  } catch (err) {
    console.error("RESPOND PROJECT REQUEST ERROR:", err);
    res.status(500).json({ error: "Failed to process request." });
  }
};

/* ===================================================
   EXPORTS
=================================================== */
module.exports = {
  createProject,
  getMyProjects,
  getProjectRequests,
  respondToProjectRequest,
};
