const supabase = require("../supabaseClient");

/* ===================================================
   1. Browse Institute Public Projects
=================================================== */
const browseProjects = async (req, res) => {
  try {
    const student_id = req.user?.user_id;

    // 1. Fetch Projects
    // Using specific foreign key 'fk_projects_created_by'
    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        project_id, title, summary, domain,
        student_mode, student_slots,
        duration, weekly_commitment,
        required_skills, expected_outcomes,
        instructor:users!fk_projects_created_by ( full_name, department )
      `)
      .eq("visibility", "INSTITUTE_PUBLIC")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!projects || projects.length === 0) {
      return res.json([]);
    }

    // 2. Attach Request/Member Status for the Logged-in Student
    if (student_id) {
        // A. Fetch Requests (PENDING, REJECTED, etc.)
        const { data: requests } = await supabase
            .from("project_requests")
            .select("project_id, status")
            .eq("student_id", student_id);

        // B. Fetch Memberships (Already Enrolled)
        const { data: memberships } = await supabase
            .from("project_members")
            .select("project_id")
            .eq("student_id", student_id);
        
        // C. Map status to projects
        const projectsWithStatus = projects.map(p => {
            const isMember = memberships?.find(m => m.project_id === p.project_id);
            const req = requests?.find(r => r.project_id === p.project_id);

            let my_status = null; // Default: No interaction
            
            if (isMember) {
                my_status = "ACCEPTED"; // Enrolled
            } else if (req) {
                my_status = req.status; // PENDING, REJECTED
            }

            return { ...p, my_status };
        });

        return res.json(projectsWithStatus);
    }

    res.json(projects);
  } catch (err) {
    console.error("BROWSE PROJECTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
};

/* ===================================================
   2. Send Request to Join Project
=================================================== */
const requestToJoinProject = async (req, res) => {
  // 1. Safety Check: Ensure User is Authenticated
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ error: "Unauthorized. Please login again." });
  }

  const student_id = req.user.user_id;
  const { project_id, message } = req.body;

  // 2. Validate Input
  if (!project_id) {
    return res.status(400).json({ error: "Project ID is required." });
  }

  try {
    // 3. Fetch Project Details (Check availability)
    const { data: project, error } = await supabase
      .from("projects")
      .select("student_mode, student_slots, title")
      .eq("project_id", project_id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // 4. Validate Mode
    if (project.student_mode === "NO_STUDENTS") {
      return res.status(403).json({ error: "This project is not accepting students." });
    }

    if (
      project.student_mode === "LIMITED_SLOTS" &&
      project.student_slots <= 0
    ) {
      return res.status(403).json({ error: "No slots available for this project." });
    }

    // 5. Check for Existing Request (Prevent Duplicates)
    const { data: existing } = await supabase
      .from("project_requests")
      .select("request_id")
      .eq("project_id", project_id)
      .eq("student_id", student_id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "You have already requested to join this project." });
    }

    // 6. Check if already a member
    const { data: isMember } = await supabase
      .from("project_members")
      .select("project_member_id")
      .eq("project_id", project_id)
      .eq("student_id", student_id)
      .maybeSingle();

    if (isMember) {
      return res.status(400).json({ error: "You are already a member of this project." });
    }

    // 7. Insert Request
    const { error: insertError } = await supabase
      .from("project_requests")
      .insert([
        { 
          project_id, 
          student_id, 
          message,
          status: "PENDING"
        }
      ]);

    if (insertError) {
      // Catch specific PostgreSQL Error 22P02 (Invalid Text Representation for UUID)
      if (insertError.code === '22P02') { 
        console.error("UUID Mismatch Error: User ID is likely an Integer but DB expects UUID.");
        return res.status(400).json({ 
          error: "System Error: Database schema mismatch. Please contact admin to fix 'student_id' column type." 
        });
      }
      throw insertError;
    }

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