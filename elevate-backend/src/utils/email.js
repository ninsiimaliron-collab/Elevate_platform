const nodemailer = require('nodemailer');
const logger = require('./logger');

const isUsingMockTransport = !process.env.SMTP_HOST;

const transport = nodemailer.createTransport(
  process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            : undefined
      }
    : { jsonTransport: true }
);

if (isUsingMockTransport) {
  logger.warn('Using email mock transport - emails will not be sent. Configure SMTP_HOST for production.');
}

const sendMail = async (to, subject, html) => {
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@elevate.ug',
      to,
      subject,
      html
    });
  } catch (error) {
    logger.error('Email send failed', { error: error.message, to, subject });
  }
};

const sendWelcomeEmail = async (to, name) => {
  await sendMail(to, 'Welcome to Elevate', `<p>Hello ${name || 'there'}, welcome to Elevate.</p>`);
};

const sendEmailVerification = async (to, name, verificationLink) => {
  await sendMail(
    to,
    'Verify your Elevate account',
    `<p>Hello ${name || 'there'},</p><p>Verify your Elevate account to unlock your full job seeker experience.</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
  );
};

const sendPasswordReset = async (to, resetLink) => {
  await sendMail(to, 'Reset your Elevate password', `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`);
};

const sendApplicationUpdate = async (to, jobTitle, status) => {
  await sendMail(to, 'Application status updated', `<p>Your application for <b>${jobTitle}</b> is now <b>${status}</b>.</p>`);
};

module.exports = {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordReset,
  sendApplicationUpdate
};
