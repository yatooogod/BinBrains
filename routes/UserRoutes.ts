const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
import Notification = require("../models/Notification");
const QRCode = require('qrcode');
const User = require('../models/User');
const Reward = require('../models/Reward');
const UsedToken = require('../models/UsedToken'); // Add the UsedToken model for tracking used tokens
const path = require('path');
const router = express.Router();

// Render login/register page
router.get('/', (req, res) => {
    res.render('index'); // Renders the login/register page
});

// Register user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();

        res.redirect('/');
    } catch (err) {
        res.status(400).send('Error registering user');
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        }).redirect('/dashboard');
    } else {
        res.status(400).send('Invalid credentials');
    }
});

// Dashboard
router.get('/dashboard', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.redirect('/');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-__v');

        if (user) {
            res.render('dashboard', {
                username: user.username,
                points: user.points,
                pointsHistory: user.pointsHistory || [],
            });
        } else {
            res.status(401).send('Unauthorized');
        }
    } catch (err) {
        res.status(401).send('Unauthorized');
    }
});

// API: Get User Points
router.get('/api/User/points', async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-__v');

        if (user) {
            res.json({ points: user.points, username: user.username, history: user.pointsHistory || [] });
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

// API: Get User Details
router.get('/api/User/details', async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-__v');

        if (user) {
            res.json({ username: user.username, points: user.points, email: user.email });
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

// Logout user
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token').redirect('/');
});

// Update username
router.post('/api/User/updateUsername', async (req, res) => {
    const { username } = req.body;
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).send('User not found.');
        }

        user.username = username;
        await user.save();

        res.status(200).send('Username updated successfully.');
    } catch (err) {
        console.error('Error updating username:', err);
        res.status(500).send('Failed to update username.');
    }
});

// Change password
router.post('/api/User/changePassword', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).send('User not found.');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).send('Incorrect current password.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).send('Password changed successfully.');
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).send('Failed to change password.');
    }
});

// Get rewards
router.get('/api/User/rewards', async (req, res) => {
    try {
        const rewards = await Reward.find({});
        res.status(200).json({ rewards });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({ error: 'Failed to fetch rewards' });
    }
});

// Redeem a reward
router.post('/api/User/purchase', async (req, res) => {
    try {
        const { rewardId } = req.body;
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        const reward = await Reward.findById(rewardId);

        if (!reward) {
            return res.status(404).json({ message: 'Reward not found' });
        }

        if (user.points < reward.points) {
            return res.status(400).json({ message: 'Insufficient points to redeem this reward' });
        }

        user.points -= reward.points;
        await user.save();

        const notificationMessage = `You successfully redeemed ${reward.name} for ${reward.points} points.`;
        const notification = new Notification({ userId: user._id, message: notificationMessage });
        await notification.save();

        return res.json({ message: `Successfully redeemed ${reward.name}`, notification: notificationMessage });
    } catch (error) {
        console.error('Error redeeming reward:', error);
        return res.status(500).json({ message: 'Error redeeming reward' });
    }
});

// Get notifications
router.get('/api/User/notifications', async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const notifications = await Notification.find({ userId: user._id }).sort({ date: -1 });
        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to add points to the user
router.get('/addpoint/:points', async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.redirect('/?redirect=' + encodeURIComponent(req.originalUrl));  // Redirect to index.html
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const pointsToAdd = parseInt(req.params.points, 10);
        user.points += pointsToAdd;

        if (!user.pointsHistory) {
            user.pointsHistory = [];
        }
        user.pointsHistory.push({ points: pointsToAdd, date: new Date() });

        await user.save();

        res.redirect('/dashboard'); // Redirect to dashboard after adding points
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/validateToken/:token/:points', async (req, res) => {
    const token = req.params.token;
    const pointsToAdd = parseInt(req.params.points, 10); // Get points from the URL

    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
        return res.status(400).send('Invalid points value.');
    }

    try {
        // Check if the user is logged in
        const userToken = req.cookies.auth_token;

        if (!userToken) {
            // If the user is not logged in, redirect them to the index page with the current URL as the "redirect" parameter
            // Inside your /validateToken route after claiming points
            return res.redirect('/dashboard?successMessage=You%20have%20successfully%20claimed%20' + pointsToAdd + '%20points.');

        }

        // If the user is logged in, process the reward
        const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).send('User not found.');
        }

        // Check if the token has already been used
        const existingToken = await UsedToken.findOne({ token });

        if (existingToken) {
            return res.status(400).send('This QR code has already been used.');
        }

        // If the token hasn't been used, mark it as used
        const newUsedToken = new UsedToken({ token });
        await newUsedToken.save();

        // Add the points to the user's account
        user.points += pointsToAdd;
        if (!user.pointsHistory) {
            user.pointsHistory = [];
        }
        user.pointsHistory.push({ points: pointsToAdd, date: new Date() });

        await user.save();

        // Create a notification for the user
        const notificationMessage = `You have claimed ${pointsToAdd} points from the QR code.`;
        const notification = new Notification({ userId: user._id, message: notificationMessage });
        await notification.save();

        // Redirect the user to the dashboard with a success message
        return res.redirect('/dashboard?successMessage=' + encodeURIComponent(`You have successfully claimed ${pointsToAdd} points.`));
    } catch (err) {
        console.error('Error validating token:', err);
        return res.status(500).send('Internal Server Error');
    }
});

// Render the login page (instead of login.html)
router.get('/login', (req, res) => {
    // Check if there's a "redirect" query parameter and pass it to the view
    const redirectUrl = req.query.redirect || '/';
    res.sendFile(path.join(__dirname, '../views/index.html'));
});



// Dashboard route
router.get('/dashboard', async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.redirect('/'); // Redirect to index.html if not logged in
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Render the dashboard (You can create a dashboard view using HTML or render as response)
        // You can pass successMessage from query parameters
        const successMessage = req.query.successMessage || '';

        res.sendFile(path.join(__dirname, '../views/dashboard.html')); // Send the dashboard.html from the views folder
    } catch (err) {
        return res.status(500).send('Internal Server Error');
    }
});


// Logout user
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token').redirect('/'); // Clear the auth token and redirect to index.html
});

module.exports = router;
