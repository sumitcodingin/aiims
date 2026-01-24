const supabase = require('../supabaseClient');
const { sendOTPEmail } = require('../utils/mailer'); // Use centralized mailer
const crypto = require('crypto');

/* =====================================================
   HELPER: Find Advisor with Minimum Engagements
===================================================== */
const findLeastLoadedAdvisor = async (department) => {
  try {
    const { data: advisors, error: advisorError } = await supabase
      .from('users')
      .select('user_id')
      .eq('role', 'Advisor')
      .eq('department', department);

    if (advisorError || !advisors || advisors.length === 0) return null;

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

    const leastLoaded = advisorCounts.reduce((min, current) => {
      return current.count < min.count ? current : min;
    }, advisorCounts[0]);

    return leastLoaded?.advisor_id || null;
  } catch (err) {
    console.error('FIND LEAST LOADED ADVISOR ERROR:', err);
    return null; 
  }
};

/* =====================================================
   LOGIN FLOW (EXISTING USERS)
===================================================== */

// STEP 1: REQUEST OTP (LOGIN)
exports.requestOTP = async (req, res) => {
  const { email } = req.body;
  console.log(`[Auth] Requesting OTP for: ${email}`);

  try {
    // 1. Check User
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.warn(`[Auth] User not found: ${email}`);
      return res.status(404).json({ error: "User not registered." });
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Store in DB
    await supabase.from('otp_store').delete().eq('email', email);
    const { error: insertError } = await supabase
      .from('otp_store')
      .insert([{ email, otp_code: otp }]);

    if (insertError) {
      console.error("[Auth] DB Insert Error:", insertError);
      return res.status(500).json({ error: "Failed to store OTP." });
    }

    // 4. Send Email (Now Awaited)
    console.time(`Email-${email}`);
    // We await this so we don't send "Success" if email actually fails
    await sendOTPEmail(email, otp);
    console.timeEnd(`Email-${email}`);

    res.json({ message: "OTP sent successfully." });
  } catch (err) {
    console.error("[Auth] Request OTP Error:", err);
    res.status(500).json({ error: "Failed to send OTP." });
  }
};

// STEP 2: VERIFY OTP (LOGIN)
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const { data: record } = await supabase
      .from('otp_store')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .single();

    if (!record) return res.status(401).json({ error: "Invalid OTP." });

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return res.status(404).json({ error: "User not found." });

    if (user.account_status === 'PENDING') {
      return res.status(403).json({ error: "Account awaiting admin approval." });
    }
    if (user.account_status === 'BLOCKED') {
      return res.status(403).json({ error: "Account has been blocked by Admin." });
    }

    const sessionId = crypto.randomUUID();

    await supabase
      .from('users')
      .update({ active_session_id: sessionId })
      .eq('user_id', user.user_id);

    await supabase.from('otp_store').delete().eq('email', email);

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
   SIGNUP FLOW (NEW USERS)
===================================================== */

// STEP 1: REQUEST OTP (SIGNUP)
exports.requestSignupOTP = async (req, res) => {
  const { email, full_name, role, department, batch, entry_no } = req.body;

  try {
    if (!email || !email.endsWith("@iitrpr.ac.in")) {
      return res.status(400).json({ error: "Email must be from IIT Ropar domain (@iitrpr.ac.in)" });
    }
    if (role === "Admin") return res.status(403).json({ error: "Admin signup not allowed." });

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) return res.status(400).json({ error: "User already exists." });

    if (role === "Student") {
      if (!department || !batch || !entry_no) {
        return res.status(400).json({ error: "Department, Batch, and Entry Number are required." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase.from('otp_store').delete().eq('email', email);
    await supabase.from('otp_store').insert([{ email, otp_code: otp }]);

    // Await email here too
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

    if (!record) return res.status(401).json({ error: "Invalid OTP." });

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email, full_name, role, department,
        advisor_id: null,
        account_status: 'PENDING'
      }])
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

    res.json({ message: "Signup successful! Please wait for Admin approval.", user: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup verification failed." });
  }
};