const supabase = require('../supabaseClient');
const { sendOTPEmail } = require('../utils/mailer');

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

    if (!record) {
      return res.status(401).json({ error: "Invalid OTP." });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await supabase.from('otp_store').delete().eq('email', email);

    res.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        name: user.full_name,
        role: user.role
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
    // Validate email domain
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
      if(!department || !batch || !entry_no) {
        return res.status(400).json({ error: "Department, Batch, and Entry Number are required." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase.from('otp_store').delete().eq('email', email);

    await supabase.from('otp_store').insert([
      { email, otp_code: otp }
    ]);

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
    // Validate email domain (defense in depth)
    if (!email || !email.endsWith("@iitrpr.ac.in")) {
      return res.status(400).json({ 
        error: "Email must be from IIT Ropar domain (@iitrpr.ac.in)" 
      });
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

    let advisorId = null;

    // ✅ AUTO-ASSIGN ADVISOR FOR STUDENT
    if (role === "Student") {
      const { data: advisor, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'Advisor')
        .eq('department', department)
        .single();

      if (error || !advisor) {
        return res.status(400).json({
          error: `No advisor found for department ${department}`
        });
      }

      advisorId = advisor.user_id;
    }

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name,
          role,
          department,
          advisor_id: advisorId
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ error: "User creation failed." });
    }

    // CREATE STUDENT PROFILE
    if (role === "Student") {
      const { error: profileError } = await supabase
        .from('student_profile')
        .insert([
          {
            student_id: user.user_id, // Link to the newly created user
            batch: batch,
            entry_no: entry_no
          }
        ]);

      if (profileError) {
        console.error("Student profile creation failed:", profileError);
        // Optional: You could delete the user record here if profile creation fails
      }
    }

    await supabase.from('otp_store').delete().eq('email', email);

    res.json({
      message: "Signup successful",
      user: {
        id: user.user_id,
        name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup verification failed." });
  }
};
