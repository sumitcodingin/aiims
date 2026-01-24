const nodemailer = require('nodemailer');

/* ============================================================
   TRANSPORTER CONFIGURATION (Fixed for Speed)
   - host: smtp.gmail.com (Direct connection)
   - family: 4 (CRITICAL FIX: Forces IPv4 to prevent 4-min IPv6 timeouts)
   - pool: true (Keeps connection alive)
============================================================ */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  pool: true,   // Reuses open connections
  maxConnections: 5,
  maxMessages: 100,
  family: 4,    // <--- THIS FIXES THE 5-MINUTE DELAY (Forces IPv4)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Fixes certificate issues on some networks
  }
});

// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email Server Error:", error);
  } else {
    console.log("✅ Email Server Ready (IPv4 Forced)");
  }
});

/* ============================================================
   1. SEND OTP EMAIL
============================================================ */
const sendOTPEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"AIMS-Lite" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Login OTP",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111;">Login Verification</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #2563eb; letter-spacing: 2px;">${otp}</h1>
          <p>This code is valid for 5 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `
    });
    console.log(`✅ OTP sent to ${email} (MsgID: ${info.messageId})`);
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
    throw error; 
  }
};

/* ============================================================
   2. SEND NOTIFICATION EMAIL (Approved/Rejected/etc)
============================================================ */
const sendNotificationEmail = async (email, action) => {
  let subject = "";
  let text = "";

  switch (action) {
    case 'APPROVED':
      subject = "🎉 Account Approved!";
      text = "<h3>Congratulations!</h3><p>Your account has been approved by the Admin. You can now login to the AIMS Portal.</p>";
      break;
    case 'REJECTED':
      subject = "Account Application Status";
      text = "<h3>Application Update</h3><p>We regret to inform you that your account application has been rejected.</p>";
      break;
    case 'BLOCKED':
      subject = "Account Suspended";
      text = "<h3>Action Required</h3><p>Your account has been temporarily blocked by the Administrator. Please contact support.</p>";
      break;
    case 'REMOVED':
      subject = "Account Removed";
      text = "<h3>Account Update</h3><p>Your account has been removed from the AIMS Portal.</p>";
      break;
    default:
      return;
  }

  try {
    await transporter.sendMail({
      from: `"AIMS-Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: text
    });
    console.log(`✅ Notification sent to ${email} [${action}]`);
  } catch (err) {
    console.error("❌ Notification sending failed:", err);
  }
};

module.exports = { sendOTPEmail, sendNotificationEmail };