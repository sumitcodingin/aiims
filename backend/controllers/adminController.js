/* file: backend/controllers/adminController.js */
const supabase = require('../supabaseClient');
const { sendNotificationEmail } = require('../utils/mailer');
const { sendCustomEmail } = require('../utils/sendCustomEmail');

/* =====================================================
   HELPER: Find Advisor with Minimum Engagements
===================================================== */
const findLeastLoadedAdvisor = async (department) => {
  try {
    console.log(`[Advisor] Finding least loaded advisor for department: ${department}`);
    
    const { data: advisors, error: advisorError } = await supabase
      .from('users')
      .select('user_id')
      .eq('role', 'Advisor')
      .eq('department', department);

    console.log(`[Advisor] Found ${advisors ? advisors.length : 0} advisors, Error: ${advisorError ? advisorError.message : 'None'}`);
    
    if (advisorError || !advisors || advisors.length === 0) {
      console.warn(`[Advisor] No advisors available for department: ${department}`);
      return null;
    }

    const advisorCounts = await Promise.all(
      advisors.map(async (advisor) => {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('advisor_id', advisor.user_id)
          .in('role', ['Student', 'Instructor']);

        if (error) return { advisor_id: advisor.user_id, count: Infinity };
        return { advisor_id: advisor.user_id, count: count || 0 };
      })
    );

    console.log(`[Advisor] Advisor loads: ${JSON.stringify(advisorCounts)}`);

    const leastLoaded = advisorCounts.reduce((min, current) => {
      return current.count < min.count ? current : min;
    }, advisorCounts[0]);

    console.log(`[Advisor] Selected least loaded advisor: ${leastLoaded?.advisor_id} with count: ${leastLoaded?.count}`);
    return leastLoaded?.advisor_id || null;
  } catch (err) {
    console.error('FIND LEAST LOADED ADVISOR ERROR:', err);
    return null; 
  }
};

// ============================
// 1. Get All Users
// ============================
exports.getUsers = async (req, res) => {
  const { role, status } = req.query;

  try {
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (status) query = query.eq('account_status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

// ============================
// 2. Handle User Action (Accept/Reject/Block)
// ============================
exports.updateUserStatus = async (req, res) => {
  const { userId, action } = req.body; // action: 'APPROVE', 'REJECT', 'BLOCK'

  try {
    // 1. Fetch user to get Email, Role, and Department
    const { data: user } = await supabase
      .from('users')
      .select('email, account_status, role, department')
      .eq('user_id', userId)
      .single();

    if (!user) return res.status(404).json({ error: "User not found" });

    let newStatus = '';
    let emailAction = '';

    // Determine Status based on Action
    if (action === 'APPROVE') {
      newStatus = 'ACTIVE';
      emailAction = 'APPROVED';
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      emailAction = 'REJECTED';
    } else if (action === 'BLOCK') {
      newStatus = 'BLOCKED';
      emailAction = 'BLOCKED';
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    // 2. Update DB and assign advisor if approving Student or Instructor
    let updatePayload = { account_status: newStatus };
    
    if (action === 'APPROVE' && (user.role === 'Student' || user.role === 'Instructor')) {
      // Find and assign least loaded advisor
      console.log(`[Admin] Assigning advisor for ${user.role} in department: ${user.department}`);
      const advisorId = await findLeastLoadedAdvisor(user.department);
      console.log(`[Admin] Found advisor ID: ${advisorId}`);
      if (advisorId) {
        updatePayload.advisor_id = advisorId;
        console.log(`[Admin] Payload with advisor: ${JSON.stringify(updatePayload)}`);
      } else {
        console.warn(`[Admin] No advisor found for department: ${user.department}`);
      }
    }

    const { error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('user_id', userId);

    if (error) throw error;

    // 3. Send Email
    await sendNotificationEmail(user.email, emailAction);

    res.json({ message: `User ${action}ED successfully.` });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
};

// ============================
// 3. Delete User (Remove)
// ============================
exports.deleteUser = async (req, res) => {
  const { userId } = req.body;

  try {
    // 1. Fetch user to get email before deleting
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (user) {
      // 2. Send 'Removed' Email
      await sendNotificationEmail(user.email, 'REMOVED');
    }

    // 3. Delete from DB
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: "User removed and notified." });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: "Failed to delete user." });
  }
};

// ============================
// 4. Reset Enrollments
// ============================
exports.resetEnrollments = async (req, res) => {
  try {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .neq('enrollment_id', 0); // Delete all

    if (error) throw error;
    res.status(200).json({ message: "Enrollments reset successfully." });
  } catch (err) {
    res.status(500).json({ error: "Reset failed." });
  }
};

// ============================
// 5. Get System Settings
// ============================
exports.getSystemSettings = async (req, res) => {
  try {
    const { data, error } = await supabase.from('system_settings').select('*');
    if(error) throw error;
    
    // Convert array to object for easier frontend consumption
    const settings = {};
    data.forEach(item => { settings[item.key] = item.value === 'true'; });
    
    res.json(settings);
  } catch (err) {
    console.error("GET SETTINGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

// ============================
// 6. Toggle Course Registration
// ============================
exports.toggleCourseRegistration = async (req, res) => {
  const { isOpen } = req.body; // true or false
  try {
    // 1. Update DB
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'course_registration', value: String(isOpen) });
    
    if(error) throw error;

    // 2. Fetch Emails (Students, Instructors, Advisors)
    const { data: users } = await supabase
      .from('users')
      .select('email')
      .in('role', ['Student', 'Instructor', 'Advisor'])
      .eq('account_status', 'ACTIVE');

    const emails = users.map(u => u.email).filter(Boolean);

    // 3. Send Bulk Email
    if (emails.length > 0) {
        const subject = isOpen 
            ? "📣 Course Registration is NOW OPEN" 
            : "🔒 Course Registration is CLOSED";
        
        const message = isOpen
            ? "Dear User,\n\nThe course add/drop window is now OPEN. Students may proceed to register for courses.\n\nRegards,\nAcademic Administration"
            : "Dear User,\n\nThe course add/drop window has been CLOSED. No further changes to enrollments are permitted.\n\nRegards,\nAcademic Administration";

        await sendCustomEmail({
            to: process.env.EMAIL_USER, // Send to self
            bcc: emails, // Hide recipients
            subject: subject,
            text: message
        });
    }

    res.json({ message: `Course registration ${isOpen ? 'Opened' : 'Closed'} and emails sent.` });
  } catch (err) {
    console.error("TOGGLE REGISTRATION ERROR:", err);
    res.status(500).json({ error: "Failed to update registration status" });
  }
};

// ============================
// 7. Toggle Grade Submission
// ============================
exports.toggleGradeSubmission = async (req, res) => {
  const { isOpen } = req.body; // true or false
  try {
    // 1. Update DB
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'grade_submission', value: String(isOpen) });
    
    if(error) throw error;

    // 2. Fetch Emails (Instructors Only)
    const { data: users } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'Instructor')
      .eq('account_status', 'ACTIVE');

    const emails = users.map(u => u.email).filter(Boolean);

    // 3. Send Bulk Email
    if (emails.length > 0) {
        const subject = isOpen 
            ? "📝 Grade Submission Portal OPEN" 
            : "🛑 Grade Submission Portal CLOSED";
        
        const message = isOpen
            ? "Dear Instructor,\n\nThe grade submission portal is now OPEN. You may proceed to award grades to your students.\n\nRegards,\nAcademic Administration"
            : "Dear Instructor,\n\nThe grade submission portal is now CLOSED. If you have pending grades, please contact the admin.\n\nRegards,\nAcademic Administration";

        await sendCustomEmail({
            to: process.env.EMAIL_USER,
            bcc: emails,
            subject: subject,
            text: message
        });
    }

    res.json({ message: `Grade submission ${isOpen ? 'Opened' : 'Closed'} and emails sent.` });
  } catch (err) {
    console.error("TOGGLE GRADING ERROR:", err);
    res.status(500).json({ error: "Failed to update grading status" });
  }
};

// ============================
// 8. Get Pending Courses for Admin
// ============================
exports.getPendingCourses = async (req, res) => {
  try {
    // Fetch courses with status PENDING_ADMIN_APPROVAL
    const { data, error } = await supabase
      .from('courses')
      .select(`
        course_id, course_code, title, department, acad_session, capacity, credits,
        instructor:users!faculty_id(full_name, email)
      `)
      .eq('status', 'PENDING_ADMIN_APPROVAL');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET PENDING COURSES ERROR:", err);
    res.status(500).json({ error: "Fetch failed." });
  }
};

// ============================
// 9. Admin Approve/Reject Course
// ============================
exports.approveCourse = async (req, res) => {
  const { courseId, action } = req.body;

  try {
    let newStatus = "";
    if (action === "APPROVE") newStatus = "APPROVED";
    else if (action === "REJECT") newStatus = "REJECTED";
    else return res.status(400).json({ error: "Invalid action." });

    const { error } = await supabase
      .from("courses")
      .update({ status: newStatus })
      .eq("course_id", courseId);

    if (error) throw error;
    
    res.json({ message: `Course ${action}ED successfully.` });
  } catch (err) {
    console.error("ADMIN APPROVE COURSE ERROR:", err);
    res.status(500).json({ error: "Failed to update course status." });
  }
};

// ===========================================
// 10. NEW: Program Application Management
// ===========================================

// Get pending program requests
exports.getProgramRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('student_programs')
            .select(`
                program_id, program_type, status, applied_at,
                student:users!student_id ( full_name, email, department )
            `)
            .eq('status', 'PENDING');
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("GET PROGRAM REQUESTS ERROR:", err);
        res.status(500).json({ error: "Fetch failed." });
    }
};

// Approve/Reject Program
exports.updateProgramStatus = async (req, res) => {
    const { programId, action } = req.body; // action: 'APPROVE' | 'REJECT'
    try {
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        
        const { error } = await supabase
            .from('student_programs')
            .update({ status: newStatus })
            .eq('program_id', programId);

        if (error) throw error;

        res.json({ message: `Application ${action}D.` });
    } catch (err) {
        console.error("UPDATE PROGRAM ERROR:", err);
        res.status(500).json({ error: "Update failed." });
    }
};