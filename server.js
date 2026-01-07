import CORS from 'cors';


// 1. Import and call the config function immediately
require('dotenv').config();

// (Your other require statements will follow here, e.g., const express = require('express');)// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// server.js (New Imports)
// ...
const Contact = require('./models/Contact'); 
const User = require('./models/User'); // <--- NEW: User Model
const jwt = require('jsonwebtoken');   // <--- NEW: JWT for tokens
const bcrypt = require('bcryptjs');   // <--- NEW: For future login logic
// ...
//const nodemailer = require('nodemailer');
// attractive_portfolio_backend/server.js
// server.js (near your other require statements)
// ...
const auth = require('./middleware/auth'); // <--- NEW IMPORT!
// ...
// Add Mongoose at the top
const mongoose = require('mongoose');
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
const FRONTEND_URL = 'https://pragatikumawat.github.io/unique_website/';
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
// server.js (Add this new route)
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists.' });
        }

        // 2. Determine if this is the first user
        const userCount = await User.countDocuments(); // 🔢 Count how many users exist
        
        // 3. Create the user document
        user = new User({ email, password });

        if (userCount === 0) {
            // This is the first user, make them the administrator.
            user.isAdmin = true; 
            console.log("Setting first user as Administrator.");
        }
        
        // 4. Save the user (hashing occurs in the pre-save hook)
        await user.save(); 

        // 5. Generate and set the JWT cookie
        const payload = { user: { id: user._id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000,
            sameSite: 'strict',
        });

        res.status(201).json({ msg: 'Registration successful.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- 5. Simple Root Route (For health check on Render) ---
// When you access the root URL of your API (https://your-api.onrender.com),
// this route confirms the server is running.
app.get('/', (req, res) => {
    res.status(200).send('Portfolio Contact API is running and ready.');
});
// The new protected route to fetch user profile data
app.get('/api/profile', auth, async (req, res) => {
    // ... logic you provided ...

try {
        // 1. Get the user ID from the verified token payload
        const userId = req.user.id; 

        // 2. Use findById to fetch the user's data
        const user = await User.findById(userId).select('-password'); 
        
        if (!user) {
            // This should rarely happen if the ID is valid
            return res.status(404).json({ msg: 'User not found.' });
        }

        // 3. Send the profile data back to the client
        res.json(user);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// server.js (New route for user login)

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Locate the User
        let user = await User.findOne({ email });

        // What should we do if 'user' is null (i.e., no user with that email was found)?
        if (!user) {
            // ...
            return res.status(401).json({ 
                msg: 'Invalid credentials.' // Vague for security
            });
        }


        // 2. Verify the Password
        const isMatch = await bcrypt.compare(password, user.password);

        // What should we do based on the value of 'isMatch'?
        if (!isMatch) {
            // ...
            return res.status(401).json({ 
                msg: 'Invalid credentials.' 
            });
        }
// 3. Token Issuance
        // Create the payload object
        const payload = { 
            user: { 
                id: user._id 
            } 
        };

        // Use jwt.sign() to create the token string
        const token = jwt.sign(
            // Argument 1: The payload
            payload,
            // Argument 2: The secret key
            process.env.JWT_SECRET,
            // Argument 3: Options (set expiration to 1 hour)
            { expiresIn: '1h' }
        );

        // ... next, set the cookie ...
// 4. Set the HTTP-only cookie and send the success response
        res.cookie('token', token, {
            httpOnly: true, // Prevents client-side JS access (XSS protection)
            secure: process.env.NODE_ENV === 'production', // Only over HTTPS
            maxAge: 3600000, // 1 hour (in milliseconds)
            sameSite: 'strict', // CSRF protection
        });

        // Send a simple success status (the token is in the cookie header)
        return res.status(200).json({ msg: 'Login successful.' });
        // If the user IS found, proceed to step 2: Verify the Password

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// server.js (New route for user logout)

app.post('/api/logout', (req, res) => {
    // 1. Clear the cookie named 'token'
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    // 2. Send a success message
    res.status(200).json({ msg: 'Logged out successfully.' });
});
// server.js (New protected route for admin to view all contacts)
app.get('/api/contacts', auth, async (req, res) => {
    try {
        // 1. Fetch the user's document using the ID from the token
        const user = await User.findById(req.user.id);

        // 2. Authorization check: If not admin, return 403 Forbidden
        if (!user.isAdmin) {
            return res.status(403).json({ 
                msg: 'Access forbidden. Administrator privileges required.' 
            });
        }

        // 3. If they ARE an admin, retrieve all contacts
        const contacts = await Contact.find().sort({ date: -1 });
        res.json(contacts);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// --- 6. Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});// server.js (inside the protected route)
