const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email with optional CC, BCC, Reply-To, and Attachments.
 * * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email body text
 * @param {string} [options.from] - Custom sender name/address
 * @param {string} [options.replyTo] - Email to reply to (e.g., Advisor's email)
 * @param {Array} [options.cc] - CC recipients
 * @param {Array} [options.bcc] - BCC recipients
 * @param {Array} [options.attachments] - File attachments (e.g., .ics file)
 */
const sendCustomEmail = async ({ 
  to, 
  subject, 
  text, 
  from,
  replyTo,
  cc = [], 
  bcc = [],
  attachments = [] 
}) => {
  
  // Default Sender: "Advisor Portal" <system_email>
  // If 'from' is passed, use it (e.g., "Dr. Advisor Name <system_email>")
  const sender = from || `"Advisor Portal" <${process.env.EMAIL_USER}>`;

  await transporter.sendMail({
    from: sender,
    to,
    replyTo: replyTo || process.env.EMAIL_USER,
    subject,
    text,
    cc,
    bcc,
    attachments
  });
};

module.exports = { sendCustomEmail };