const nodemailer = require('nodemailer');

/* ============================================================
   TRANSPORTER CONFIGURATION (Optimized)
   - host: smtp.gmail.com
   - family: 4 (Forces IPv4 at socket level)
   - pool: true (Keeps connection alive for speed)
============================================================ */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  pool: true,   // Reuses open connections
  maxConnections: 5,
  maxMessages: 100,
  family: 4,    // <--- CRITICAL: Forces IPv4 network stack
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Helps with some strict firewalls
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
    // Don't throw error here to prevent crashing the request loop, just log it
  }
};

/* ============================================================
   2. SEND ENROLLMENT STATUS EMAIL (Moved from sendEmail.js)
============================================================ */
const sendStatusEmail = async (email, studentName, courseTitle, status) => {
  if (!email) return;

  try {
    let statusMessage = "";
    let color = "#333";

    switch (status) {
      case "PENDING_INSTRUCTOR_APPROVAL":
        statusMessage = "Your application has been submitted and is pending Instructor approval.";
        color = "#d97706"; // Amber
        break;
      case "PENDING_ADVISOR_APPROVAL":
        statusMessage = "The Instructor has approved your application. It is now pending Advisor approval.";
        color = "#2563eb"; // Blue
        break;
      case "ENROLLED":
        statusMessage = "Congratulations! You have been successfully enrolled in this course.";
        color = "#16a34a"; // Green
        break;
      case "INSTRUCTOR_REJECTED":
      case "ADVISOR_REJECTED":
        statusMessage = "We regret to inform you that your application for this course was rejected.";
        color = "#dc2626"; // Red
        break;
      case "DROPPED_BY_STUDENT":
        statusMessage = "You have successfully dropped this course.";
        color = "#555";
        break;
      default:
        statusMessage = `Your enrollment status has changed to ${status.replace(/_/g, " ")}.`;
    }

    await transporter.sendMail({
      from: `"AIMS Notifications" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Course Status Update: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: ${color};">Enrollment Status Update</h2>
          <p>Dear <b>${studentName}</b>,</p>
          <p>The status of your enrollment for the course <b>${courseTitle}</b> has been updated.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>Current Status:</strong> ${status.replace(/_/g, " ")}</p>
            <p style="margin: 5px 0 0;">${statusMessage}</p>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">Automated message from AIMS Portal.</p>
        </div>
      `
    });
    console.log(`✅ Status email sent to ${email} [${status}]`);
  } catch (err) {
    console.error("❌ Status Email Error:", err);
  }
};

/* ============================================================
   3. SEND ADMIN NOTIFICATION EMAIL
============================================================ */
const sendNotificationEmail = async (email, action) => {
  let subject = "";
  let text = "";

  switch (action) {
    case 'APPROVED':
      subject = "🎉 Account Approved!";
      text = "<h3>Congratulations!</h3><p>Your account has been approved by the Admin.</p>";
      break;
    case 'REJECTED':
      subject = "Account Application Status";
      text = "<h3>Application Update</h3><p>Your account application has been rejected.</p>";
      break;
    case 'BLOCKED':
      subject = "Account Suspended";
      text = "<h3>Action Required</h3><p>Your account has been temporarily blocked.</p>";
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

module.exports = { sendOTPEmail, sendStatusEmail, sendNotificationEmail };