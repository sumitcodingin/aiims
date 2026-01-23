const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendCustomEmail = async ({ to, subject, text, cc = [], bcc = [] }) => {
  await transporter.sendMail({
    from: `"Advisor Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    cc,
    bcc,
  });
};

module.exports = { sendCustomEmail };
