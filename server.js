// portfolio-backend/server.js
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    // IMPORTANT: Replace with the exact URL of your deployed React frontend 
    // when you go live (e.g., 'https://yourportfolio.netlify.app'). 
    // For local development, this allows your React frontend (port 5173/3000) 
    // to talk to your backend (port 5000).
    origin: 'https://github.com/Pragatikumawat/attractive_portfolio_backend' 
}));
app.use(express.json()); // Allows parsing of JSON request bodies

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider (e.g., 'outlook', 'yahoo')
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- Contact Form Submission Endpoint ---
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill out all fields.' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: process.env.EMAIL_USER,   // Receiver address (usually your own email)
        subject: `New Portfolio Contact from ${name}`,
        html: `
            <h3>Contact Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <h3>Message:</h3>
            <p>${message}</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Nodemailer Error:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});