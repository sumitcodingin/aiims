const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ==============================
// 1. Send OTP Email
// ==============================
const sendOtpEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"UMS Auth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      html: `<h2>Your OTP is <b>${otp}</b></h2>`
    });
    console.log(`OTP sent to ${email}`);
  } catch (err) {
    console.error("OTP Email Error:", err);
  }
};

// ==============================
// 2. Send Enrollment Status Email
// ==============================
const sendStatusEmail = async (email, studentName, courseTitle, status) => {
  if (!email) return;

  try {
    let statusMessage = "";
    let color = "#333";

    // Customize message based on status
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

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: ${color};">Enrollment Status Update</h2>
        <p>Dear <b>${studentName}</b>,</p>
        <p>The status of your enrollment for the course <b>${courseTitle}</b> has been updated.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>Current Status:</strong> ${status.replace(/_/g, " ")}</p>
          <p style="margin: 5px 0 0;">${statusMessage}</p>
        </div>

        <p>Please log in to your portal for more details.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated message from the University Management System.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"UMS Notifications" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Course Status Update: ${courseTitle}`,
      html: htmlContent
    });
    console.log(`Status email sent to ${email} [${status}]`);
  } catch (err) {
    console.error("Status Email Error:", err);
  }
};

module.exports = { sendOtpEmail, sendStatusEmail };