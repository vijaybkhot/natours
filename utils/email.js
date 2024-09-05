const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// Section 206 - Building a complex email Handler
// -------------------------------------
// new Email(user, url).sendWelcome()

// An email class from which we can create email objects that we can then use to send actual emails
module.exports = class Email {
  // To create a new email object, we pass in a user and a url
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Vijay Khot <${process.env.EMAIL_FROM}>`;
  }

  // Create different transports for different enviornments
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Section 209 - Using Sendgrid for 'Real' Emails
      // Configure SendGrid SMTP
      return nodemailer.createTransport({
        service: 'SendGrid',
        // host: 'smtp-relay.brevo.com', // Brevo's SMTP host
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
      // service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Activate in gmail "less secure app" option
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
        text: htmlToText.convert(html), // Just an option if someone wants to send plain text. We convert the HTML to plain text
      };

      // 3) Create a transport and send email
      console.log('Creating email transport...', `${subject}, ${template}`);
      await this.newTransport().sendMail(mailOptions); // sendMail(mailOptions) function is a method provided by the nodemailer library
      //  When we call nodemailer.createTransport() in our newTransport() method, it creates a transporter object. This transporter object has a method called sendMail(), which is used to send an email with the specified options.
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
};

// -------------------------------------

// const sendEmail = async (options) => {
//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     // service: 'Gmail',
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     // Activate in gmail "less secure app" option
//   });
//   // 2) Define the email options
//   const mailOptions = {
//     from: 'Vijay Khot <hello@vijay.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     //html:
//   };
//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
