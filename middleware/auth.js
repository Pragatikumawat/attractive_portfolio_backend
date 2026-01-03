// middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Get the Authorization header value (e.g., 'Bearer <token>')
    const authHeader = req.header('Authorization');

    // 2. Check if the header exists
    if (!authHeader) {
        // 401: Unauthorized - Access denied, no token provided
        return res.status(401).json({ msg: 'No token, authorization denied.' });
    }
    
    // --- Next Step: Check the "Bearer" format ---
    const parts = authHeader.split(' ');
    
    // Check if the format is "Bearer <token>"
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token format is invalid.' });
    }

    // Extract the token string (the second part)
    const token = parts[1];
    
    // 3. Verify the token...

// middleware/auth.js (Step 3: Verify the token)

// ... (code to extract the token string)

    try {
        // 3a. Verify the token using the secret key
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET // <--- This is the key we must use!
        );

        // 3b. Attach the decoded user payload to the request object
        req.user = decoded.user;
        
        // 3c. Move on to the next middleware or the route handler
        next();

    } catch (err) {
        // 4. Handle an invalid token
        // 4. Handle an invalid token (expired, wrong secret, etc.)
        res.status(401).json({ msg: 'Token is not valid.' });
        // ... (What status code should we send here?)
    }
};
    
    // ...
