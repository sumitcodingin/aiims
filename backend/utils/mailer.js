const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"AIMS-Lite" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Login OTP",
    html: `<h2>Your OTP is <b>${otp}</b></h2><p>Valid for 5 minutes</p>`
  });
};

module.exports = { sendOTPEmail };
