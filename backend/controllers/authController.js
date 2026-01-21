const supabase = require('../supabaseClient');
const { sendOTPEmail } = require('../utils/mailer');
const crypto = require('crypto');

/* =====================================================
   LOGIN FLOW (EXISTING USERS)
===================================================== */

// STEP 1: REQUEST OTP (LOGIN)
exports.requestOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not registered." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase.from('otp_store').delete().eq('email', email);

    const { error: insertError } = await supabase
      .from('otp_store')
      .insert([{ email, otp_code: otp }]);

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ error: "Failed to store OTP." });
    }

    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP." });
  }
};

// STEP 2: VERIFY OTP (LOGIN) — ✅ SINGLE SESSION ENFORCED
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // 1️⃣ Verify OTP
    const { data: record } = await supabase
      .from('otp_store')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .single();

    if (!record) {
      return res.status(401).json({ error: "Invalid OTP." });
    }

    // 2️⃣ Fetch user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 3️⃣ Admin approval checks
    if (user.account_status === 'PENDING') {
      return res.status(403).json({ error: "Account awaiting admin approval." });
    }
    if (user.account_status === 'BLOCKED') {
      return res.status(403).json({ error: "Account has been blocked by Admin." });
    }

    // 4️⃣ 🔐 Generate NEW session ID (invalidates previous login)
    const sessionId = crypto.randomUUID();

    await supabase
      .from('users')
      .update({ active_session_id: sessionId })
      .eq('user_id', user.user_id);

    // 5️⃣ Cleanup OTP
    await supabase.from('otp_store').delete().eq('email', email);

    // 6️⃣ Send response
    res.json({
      message: "Login successful",
      sessionId,
      user: {
        id: user.user_id,
        name: user.full_name,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OTP verification failed." });
  }
};

/* =====================================================
   HELPER: Find Advisor with Minimum Engagements
===================================================== */

/**
 * Finds the advisor in the same department with the minimum number of
 * current student/instructor engagements (load balancing).
 * @param {string} department - Department of the new user
 * @returns {Promise<number|null>} advisor_id or null if no advisor found
 */
const findLeastLoadedAdvisor = async (department) => {
  try {
    // 1. Get all advisors in the same department
    const { data: advisors, error: advisorError } = await supabase
      .from('users')
      .select('user_id')
      .eq('role', 'Advisor')
      .eq('department', department);

    if (advisorError || !advisors || advisors.length === 0) {
      return null; // No advisors in this department
    }

    // 2. For each advisor, count their current engagements (students + instructors)
    const advisorCounts = await Promise.all(
      advisors.map(async (advisor) => {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('advisor_id', advisor.user_id)
          .in('role', ['Student', 'Instructor']);

        if (error) {
          console.error(`Error counting engagements for advisor ${advisor.user_id}:`, error);
          return { advisor_id: advisor.user_id, count: Infinity };
        }

        return {
          advisor_id: advisor.user_id,
          count: count || 0,
        };
      })
    );

    // 3. Find advisor with minimum count
    const leastLoaded = advisorCounts.reduce((min, current) => {
      return current.count < min.count ? current : min;
    }, advisorCounts[0]);

    return leastLoaded?.advisor_id || null;
  } catch (err) {
    console.error('FIND LEAST LOADED ADVISOR ERROR:', err);
    return null; // Fail gracefully - user can be assigned advisor later
  }
};

/* =====================================================
   SIGNUP FLOW (NEW USERS)
===================================================== */

// STEP 1: REQUEST OTP (SIGNUP)
exports.requestSignupOTP = async (req, res) => {
  const { email, full_name, role, department, batch, entry_no } = req.body;

  try {
    if (!email || !email.endsWith("@iitrpr.ac.in")) {
      return res.status(400).json({
        error: "Email must be from IIT Ropar domain (@iitrpr.ac.in)"
      });
    }

    if (role === "Admin") {
      return res.status(403).json({ error: "Admin signup not allowed." });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    if (role === "Student") {
      if (!department || !batch || !entry_no) {
        return res.status(400).json({
          error: "Department, Batch, and Entry Number are required."
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase.from('otp_store').delete().eq('email', email);
    await supabase.from('otp_store').insert([{ email, otp_code: otp }]);

    await sendOTPEmail(email, otp);

    res.json({
      message: "Signup OTP sent",
      tempUser: { email, full_name, role, department, batch, entry_no }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send signup OTP." });
  }
};

// STEP 2: VERIFY OTP & CREATE USER
exports.verifySignupOTP = async (req, res) => {
  const { email, otp, full_name, role, department, batch, entry_no } = req.body;

  try {
    if (!email || !email.endsWith("@iitrpr.ac.in")) {
      return res.status(400).json({ error: "Email must be from IIT Ropar domain." });
    }

    const { data: record } = await supabase
      .from('otp_store')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .single();

    if (!record) {
      return res.status(401).json({ error: "Invalid OTP." });
    }

    // 🚀 AUTOMATIC ADVISOR ALLOCATION (Load Balancing)
    // Assign advisor with minimum engagements to Student/Instructor roles
    let advisorId = null;
    if (role === "Student" || role === "Instructor") {
      advisorId = await findLeastLoadedAdvisor(department);
      // If no advisor found, advisorId remains null (can be assigned manually later by admin)
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name,
          role,
          department,
          advisor_id: advisorId,
          account_status: 'PENDING'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    if (role === "Student") {
      await supabase.from('student_profile').insert([{
        student_id: user.user_id,
        batch,
        entry_no
      }]);
    }

    await supabase.from('otp_store').delete().eq('email', email);

    res.json({
      message: "Signup successful! Please wait for Admin approval.",
      user: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup verification failed." });
  }
};
