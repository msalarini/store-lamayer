const ALLOWED_EMAILS = ['marcussalarini@gmail.com', 'llamayer@hotmail.com'];

const authMiddleware = (req, res, next) => {
    // In a real production app, we would verify a JWT token here.
    // For this MVP/Prototype, we will trust the 'x-user-email' header sent by the frontend
    // after it has performed the OAuth login.

    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized: No email provided' });
    }

    if (!ALLOWED_EMAILS.includes(userEmail)) {
        return res.status(403).json({ error: 'Forbidden: Email not authorized' });
    }

    req.user = { email: userEmail };
    next();
};

module.exports = authMiddleware;
