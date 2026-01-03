// attractive_portfolio_backend/models/Contact.js
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', ContactSchema);
// server.js (Complete /api/contacts route)

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