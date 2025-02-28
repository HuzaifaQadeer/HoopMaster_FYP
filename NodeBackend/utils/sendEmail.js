const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
  console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Set' : 'Not set');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  // Define email options
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
