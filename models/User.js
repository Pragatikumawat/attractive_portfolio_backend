// models/User.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// We'll need bcryptjs here soon!
const bcrypt = require('bcryptjs'); // <--- New Import!

// Define how secure the hashing should be (Salt Rounds)
const SALT_WORK_FACTOR = 10;
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Crucial for registration
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },


// 🔑 NEW FIELD: Role-based access control
    isAdmin: {
        type: Boolean,
        default: false, // Default to false for all new registrations
    },



    
    // Optional: add a 'createdAt' timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// We need to add a crucial security step here...
// --- Mongoose Pre-Save Middleware (The Hashing Logic) ---
UserSchema.pre('save', async function(next) {
    // 1. Only hash the password if it is new or has been modified
    if (!this.isModified('password')) return next();
    
    try {
        // 2. Generate a salt (random string)
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        
        // 3. Hash the password with the salt
        const hash = await bcrypt.hash(this.password, salt);
        
        // 4. Overwrite the plain text password with the hash
        this.password = hash;
        
        // 5. Move to the next middleware/save operation
        next();
    } catch (err) {
        next(err);
    }
});


module.exports = mongoose.model('User', UserSchema);