const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON data in POST requests
app.use(bodyParser.json());

// Configure nodemailer to use your email service (e.g., Gmail)
const transporter = nodemailer.createTransport({
    service: 'erion.haxhikadrija12@gmail.com', // e.g., 'Gmail'
    auth: {
        user: 'erion.haxhikadrija12@gmail.com',
        pass: 'haha',
    },
});

// Define a route to handle the form submission
app.post('/send-email', (req, res) => {
    const { username, email, phoneNumber, lastName, message } = req.body;

    const mailOptions = {
        from: 'erion.haxhikadrija12@gmail.com',
        to: 'haxhikadrija.erion@gmail.com', // Your email address
        subject: 'New Contact Form Submission',
        text: `First Name: ${username}\nLast Name: ${lastName}\nEmail: ${email}\nPhone Number: ${phoneNumber}\nMessage: ${message}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Failed to send the email');
        } else {
            console.log('Email sent:', info.response);
            res.status(200).send('Email sent successfully');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});