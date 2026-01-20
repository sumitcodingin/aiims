const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Existing OTP Email
const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"AIMS-Lite" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Login OTP",
    html: `<h2>Your OTP is <b>${otp}</b></h2><p>Valid for 5 minutes</p>`
  });
};

// 2. 🚀 NEW: Status Notification Email
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
    console.log(`Email sent to ${email} for action: ${action}`);
  } catch (err) {
    console.error("Email sending failed:", err);
  }
};

module.exports = { sendOTPEmail, sendNotificationEmail };