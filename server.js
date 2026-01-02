// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
//const nodemailer = require('nodemailer');
// attractive_portfolio_backend/server.js

// Add Mongoose at the top
const mongoose = require('mongoose');
const Contact = require('./models/Contact');
// ... rest of the required modules (express, bodyParser, cors, etc.)

// --- NEW: MongoDB Connection Setup ---
// The connection string will be saved securely on Render.
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully.'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        // Optional: Exit the process if the database connection fails
        // process.exit(1); 
    });

// --- 3. Nodemailer Transporter Setup (Keep this section) ---
// ...

// --- 4. Contact Form API Route (We'll update this next) ---
// ...

// --- 6. Start the Server ---


// Load environment variables from .env file for local development
// We use process.env.NODE_ENV === 'production' to handle live credentials on Render
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 10000;

// --- 1. CORS Configuration (CRITICAL FOR DEPLOYMENT) ---
// In a production environment (like Render), we use the environment variables 
// and the specific URL of the deployed GitHub Pages site.

// 🔑 IMPORTANT: Replace with your actual GitHub Pages URL
const FRONTEND_URL = 'https://pragatikumawat.github.io'; // <-- CRITICAL FIX: Removed /unique_website
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? FRONTEND_URL : 'http://localhost:5173'
}));

// --- 2. Middleware ---
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// const sgTransport = require('nodemailer-sendgrid-transport');
// // --- 3. Nodemailer Transporter Setup ---
// // Uses credentials securely stored as environment variables on Render (EMAIL_USER, EMAIL_PASS)
// const transporter = nodemailer.createTransport(sgTransport({
//     auth: {
//         api_key: process.env.SENDGRID_API_KEY // Use the new variable
//     }
// })); 
// --- 4. Contact Form API Route ---
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Configure the email content
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: process.env.EMAIL_USER,   // Receiver address (your email)
        subject: `New Portfolio Contact from ${name}`, // Subject line
        html: `
            <h3>Contact Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <h3>Message:</h3>
            <p>${message.replace(/\n/g, '<br>')}</p>
        `,
    };

    try {

        // --- NEW: Save to MongoDB ---
        const newContact = new Contact({ name, email, message });
        await newContact.save();
      
        // await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', process.env.EMAIL_USER);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Nodemailer Error:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// --- 5. Simple Root Route (For health check on Render) ---
// When you access the root URL of your API (https://your-api.onrender.com),
// this route confirms the server is running.
app.get('/', (req, res) => {
    res.status(200).send('Portfolio Contact API is running and ready.');
});


// --- 6. Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});