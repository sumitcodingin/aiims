const supabase = require('../supabaseClient');
const { sendOTPEmail } = require('../utils/mailer');

// ============================
// STEP 1: REQUEST OTP (NO EXPIRY)
// ============================
exports.requestOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not registered." });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Remove any previous OTPs for this email
    await supabase
      .from('otp_store')
      .delete()
      .eq('email', email);

    // 4. Store new OTP (NO EXPIRY)
    const { error: insertError } = await supabase
      .from('otp_store')
      .insert([
        {
          email: email,
          otp_code: otp
        }
      ]);

    if (insertError) {
      console.error("OTP INSERT ERROR:", insertError);
      return res.status(500).json({ error: "Failed to store OTP." });
    }

    // 5. Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (err) {
    console.error("REQUEST OTP ERROR:", err);
    res.status(500).json({ error: "Failed to send OTP." });
  }
};

// ============================
// STEP 2: VERIFY OTP (NO EXPIRY)
// ============================
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // 1. Validate OTP
    const { data: record, error: otpError } = await supabase
      .from('otp_store')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .single();

    if (otpError || !record) {
      return res.status(401).json({ error: "Invalid OTP." });
    }

    // 2. Fetch user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 3. Delete OTP after successful login (one-time use)
    await supabase
      .from('otp_store')
      .delete()
      .eq('email', email);

    // 4. Login success
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.user_id,
        name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: "OTP verification failed." });
  }
};
