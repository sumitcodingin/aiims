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

  let {
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

  // Validate slots if mode is LIMITED_SLOTS (and not OPEN)
  if (
    student_mode === "LIMITED_SLOTS" &&
    (student_slots === null ||
      student_slots === undefined ||
      Number(student_slots) <= 0)
  ) {
    return res.status(400).json({
      error: "Valid number of student_slots required for LIMITED_SLOTS mode.",
    });
  }

  /* ---------- WORKAROUND FOR 'OPEN' MODE ---------- */
  // DB enum only supports 'NO_STUDENTS' or 'LIMITED_SLOTS'.
  // If 'OPEN', we map to 'LIMITED_SLOTS' with a high number (e.g. 10000)
  if (student_mode === "OPEN") {
    student_mode = "LIMITED_SLOTS";
    student_slots = 10000;
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
   3. GET PROJECT REQUESTS & MEMBERS
=================================================== */
const getProjectRequests = async (req, res) => {
  const instructor_id = req.user?.user_id;
  const { project_id } = req.query;

  if (!instructor_id || !project_id) {
    return res.status(400).json({ error: "Invalid request. Project ID required." });
  }

  try {
    // 1. Verify Ownership
    const { data: project } = await supabase
      .from("projects")
      .select("created_by")
      .eq("project_id", project_id)
      .single();

    if (!project || project.created_by !== instructor_id) {
      return res.status(403).json({ error: "Unauthorized access to this project." });
    }

    // 2. Fetch Pending Requests
    const { data: requestsData } = await supabase
      .from("project_requests")
      .select("request_id, student_id, message, status, created_at")
      .eq("project_id", project_id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });
    
    const requests = requestsData || [];

    // 3. Fetch Enrolled Members
    const { data: membersData } = await supabase
      .from("project_members")
      .select("project_member_id, student_id, joined_at")
      .eq("project_id", project_id)
      .order("joined_at", { ascending: false });

    const members = membersData || [];

    // 4. Manually Fetch Student Details (Users) to avoid FK mismatch crashes
    const studentIds = [...new Set([
        ...requests.map(r => r.student_id),
        ...members.map(m => m.student_id)
    ])];

    let usersMap = {};
    if (studentIds.length > 0) {
        const { data: users } = await supabase
            .from("users")
            .select("user_id, full_name, email, department")
            .in("user_id", studentIds);
        
        if (users) {
            users.forEach(u => { usersMap[u.user_id] = u; });
        }
    }

    // 5. Merge Data
    const enrichedRequests = requests.map(r => ({
        ...r, 
        student: usersMap[r.student_id] || { full_name: "Unknown", email: "N/A" }
    }));

    const enrichedMembers = members.map(m => ({
        ...m,
        student: usersMap[m.student_id] || { full_name: "Unknown", email: "N/A" }
    }));

    // Return combined object
    res.json({
        requests: enrichedRequests,
        members: enrichedMembers
    });

  } catch (err) {
    console.error("GET PROJECT DATA ERROR:", err);
    res.status(500).json({ error: "Failed to fetch project data." });
  }
};

/* ===================================================
   4. ACCEPT / REJECT PROJECT REQUEST
=================================================== */
const respondToProjectRequest = async (req, res) => {
  const instructor_id = req.user?.user_id;
  const { request_id, action } = req.body; // action: "ACCEPT" or "REJECT"

  if (!instructor_id || !request_id || !["ACCEPT", "REJECT"].includes(action)) {
    return res.status(400).json({ error: "Invalid request parameters." });
  }

  try {
    // 1. Fetch Request & Project Details
    const { data: reqData, error: fetchError } = await supabase
      .from("project_requests")
      .select(`
        request_id,
        student_id,
        project_id,
        status,
        project:projects (
          created_by,
          student_mode,
          student_slots
        )
      `)
      .eq("request_id", request_id)
      .single();

    if (fetchError || !reqData) {
      return res.status(404).json({ error: "Request not found." });
    }

    // 2. Verify Instructor Ownership
    if (reqData.project.created_by !== instructor_id) {
      return res.status(403).json({ error: "Unauthorized to manage this project." });
    }

    if (reqData.status !== "PENDING") {
      return res.status(400).json({ error: "Request has already been processed." });
    }

    /* =======================================
       HANDLE ACCEPT
    ======================================= */
    if (action === "ACCEPT") {
      // A. Check Slots (only if LIMITED)
      if (
        reqData.project.student_mode === "LIMITED_SLOTS" &&
        reqData.project.student_slots <= 0
      ) {
        return res.status(400).json({ error: "No slots available. Cannot accept more students." });
      }

      // B. Check if already a member
      const { data: exists } = await supabase
        .from("project_members")
        .select("project_member_id")
        .eq("project_id", reqData.project_id)
        .eq("student_id", reqData.student_id)
        .maybeSingle();

      if (!exists) {
        // C. Insert into Project Members
        const { error: memberError } = await supabase
          .from("project_members")
          .insert([
            {
              project_id: reqData.project_id,
              student_id: reqData.student_id,
            },
          ]);
        
        if (memberError) throw memberError;

        // D. Update Slots (only if LIMITED)
        if (reqData.project.student_mode === "LIMITED_SLOTS") {
          await supabase
            .from("projects")
            .update({
              student_slots: reqData.project.student_slots - 1,
            })
            .eq("project_id", reqData.project_id);
        }
      }
    }

    /* =======================================
       UPDATE REQUEST STATUS
    ======================================= */
    const status = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
    
    await supabase
      .from("project_requests")
      .update({ status: status })
      .eq("request_id", request_id);

    res.json({
      message: `Request ${status.toLowerCase()} successfully.`,
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