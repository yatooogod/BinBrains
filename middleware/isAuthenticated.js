const jwt = require('jsonwebtoken');

function isAuthenticated(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.redirect('/'); // Redirect to login page if no token is present
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to the request object
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        console.error('Invalid token:', err);
        res.redirect('/'); // Redirect to login if token is invalid
    }
}

module.exports = isAuthenticated;
