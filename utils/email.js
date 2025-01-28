import nodemailer from 'nodemailer';
import pug from 'pug';
import { htmlToText } from 'html-to-text';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory of the module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Section 206 - Building a complex email Handler
// -------------------------------------
// new Email(user, url).sendWelcome()

// An email class from which we can create email objects that we can then use to send actual emails
export default class Email {
  // To create a new email object, we pass in a user and a url
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Vijay Khot <${process.env.EMAIL_FROM}>`;
  }

  // Create different transports for different environments
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Section 209 - Using Sendgrid for 'Real' Emails
      // Configure SendGrid SMTP
      return nodemailer.createTransport({
        service: 'SendGrid',
        host: 'smtp.sendgrid.net', // SendGrid SMTP server,
        port: 587, // Typically, 587 is used for TLS connections
        auth: {
          user: process.env.SENDGRID_USERNAME, // Your SENDGRID username
          pass: process.env.SENDGRID_PASSWORD, // Your SENDGRID password
        },
        secure: false, // Use TLS if available
        tls: {
          rejectUnauthorized: false, // Do not reject unauthorized certificates
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email - takes in a template and a subject
  async send(template, subject) {
    try {
      //  1) Render HTML based on a pug template
      const html = pug.renderFile(
        `${__dirname}/../views/email/${template}.pug`,
        {
          firstName: this.firstName,
          url: this.url,
          subject: subject,
        },
      ); // We will be sending the email as an HTML. We use the pug module to build the html from a file

      // 2) Define the email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject: subject,
        html: html,
        text: htmlToText(html),
      };

      // 3) Create a transport and send email
      await this.newTransport().sendMail(mailOptions); // sendMail(mailOptions) function is a method provided by the nodemailer library
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // We will not send email using the above send function, but, instead we will create one different function for each type of email we want to send
  // First send email function to send welcome email
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the NATOURS Family!'); // 'welcome' is a pug template
  }

  // Section - 208 - Sending password reset emails
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    ); // 'passwordReset' is a pug template
  }
}
