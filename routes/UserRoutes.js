"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Notification_1 = __importDefault(require("../models/Notification")); // Adjusted import syntax
const User_1 = __importDefault(require("../models/User"));
const Reward_1 = __importDefault(require("../models/Reward"));
const UsedToken_1 = __importDefault(require("../models/UsedToken")); // Added the UsedToken model for tracking used tokens
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Render login/register page
router.get('/', (req, res) => {
    res.render('index'); // Renders the login/register page
});
// Register user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
    try {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = new User_1.default({ username, password: hashedPassword });
        yield user.save();
        res.redirect('/');
    }
    catch (err) {
        res.status(400).send('Error registering user');
    }
}));
// Login user
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
    const user = yield User_1.default.findOne({ username });
    if (user && (yield bcryptjs_1.default.compare(password, user.password))) {
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        }).redirect('/dashboard');
    }
    else {
        res.status(400).send('Invalid credentials');
    }
}));
// Dashboard
router.get('/dashboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.auth_token;
    if (!token)
        return res.redirect('/');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id).select('-__v');
        if (user) {
            res.render('dashboard', {
                username: user.username,
                points: user.points,
                pointsHistory: user.pointsHistory || [],
            });
        }
        else {
            res.status(401).send('Unauthorized');
        }
    }
    catch (err) {
        res.status(401).send('Unauthorized');
    }
}));
// API: Get User Points
router.get('/api/User/points', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id).select('-__v');
        if (user) {
            res.json({ points: user.points, username: user.username, history: user.pointsHistory || [] });
        }
        else {
            res.status(404).send('User not found');
        }
    }
    catch (err) {
        res.status(500).send('Internal Server Error');
    }
}));
// API: Get User Details
router.get('/api/User/details', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id).select('-__v');
        if (user) {
            res.json({ username: user.username, points: user.points, email: user.email });
        }
        else {
            res.status(404).send('User not found');
        }
    }
    catch (err) {
        res.status(500).send('Internal Server Error');
    }
}));
// Logout user
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token').redirect('/');
});
// Update username
router.post('/api/User/updateUsername', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.body;
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        user.username = username;
        yield user.save();
        res.status(200).send('Username updated successfully.');
    }
    catch (err) {
        console.error('Error updating username:', err);
        res.status(500).send('Failed to update username.');
    }
}));
// Change password
router.post('/api/User/changePassword', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentPassword, newPassword } = req.body;
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).send('Incorrect current password.');
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        yield user.save();
        res.status(200).send('Password changed successfully.');
    }
    catch (err) {
        console.error('Error changing password:', err);
        res.status(500).send('Failed to change password.');
    }
}));
// Get rewards
router.get('/api/User/rewards', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rewards = yield Reward_1.default.find({});
        res.status(200).json({ rewards });
    }
    catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({ error: 'Failed to fetch rewards' });
    }
}));
// Redeem a reward
router.post('/api/User/purchase', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rewardId } = req.body;
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(401).json({ message: 'User not logged in' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id);
        const reward = yield Reward_1.default.findById(rewardId);
        if (!reward) {
            return res.status(404).json({ message: 'Reward not found' });
        }
        if (user.points < reward.points) {
            return res.status(400).json({ message: 'Insufficient points to redeem this reward' });
        }
        user.points -= reward.points;
        yield user.save();
        const notificationMessage = `You successfully redeemed ${reward.name} for ${reward.points} points.`;
        const notification = new Notification_1.default({ userId: user._id, message: notificationMessage });
        yield notification.save();
        return res.json({ message: `Successfully redeemed ${reward.name}`, notification: notificationMessage });
    }
    catch (error) {
        console.error('Error redeeming reward:', error);
        return res.status(500).json({ message: 'Error redeeming reward' });
    }
}));
// Get notifications
router.get('/api/User/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const notifications = yield Notification_1.default.find({ userId: user._id }).sort({ date: -1 });
        res.json({ notifications });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Internal Server Error');
    }
}));
// Route to add points to the user
router.get('/addpoint/:points', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.redirect('/?redirect=' + encodeURIComponent(req.originalUrl)); // Redirect to index.html
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const pointsToAdd = parseInt(req.params.points, 10);
        user.points += pointsToAdd;
        if (!user.pointsHistory) {
            user.pointsHistory = [];
        }
        user.pointsHistory.push({ points: pointsToAdd, date: new Date() });
        yield user.save();
        res.redirect('/dashboard'); // Redirect to dashboard after adding points
    }
    catch (err) {
        res.status(500).send('Internal Server Error');
    }
}));
// Validate token
router.get('/validateToken/:token/:points', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.params.token;
    const pointsToAdd = parseInt(req.params.points, 10); // Get points from the URL
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
        return res.status(400).send('Invalid points value.');
    }
    try {
        const userToken = req.cookies.auth_token;
        if (!userToken) {
            return res.redirect('/dashboard?successMessage=You%20have%20successfully%20claimed%20' + pointsToAdd + '%20points.');
        }
        const decoded = jsonwebtoken_1.default.verify(userToken, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        const existingToken = yield UsedToken_1.default.findOne({ token });
        if (existingToken) {
            return res.status(400).send('This QR code has already been used.');
        }
        const newUsedToken = new UsedToken_1.default({ token });
        yield newUsedToken.save();
        user.points += pointsToAdd;
        if (!user.pointsHistory) {
            user.pointsHistory = [];
        }
        user.pointsHistory.push({ points: pointsToAdd, date: new Date() });
        yield user.save();
        const notificationMessage = `You have claimed ${pointsToAdd} points from the QR code.`;
        const notification = new Notification_1.default({ userId: user._id, message: notificationMessage });
        yield notification.save();
        return res.redirect('/dashboard?successMessage=' + encodeURIComponent(`You have successfully claimed ${pointsToAdd} points.`));
    }
    catch (err) {
        console.error('Error validating token:', err);
        return res.status(500).send('Internal Server Error');
    }
}));
// Render the login page
router.get('/login', (req, res) => {
    const redirectUrl = req.query.redirect || '/';
    res.sendFile(path_1.default.join(__dirname, '../views/index.html'));
});
// Dashboard route
router.get('/dashboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.redirect('/'); // Redirect to index.html if not logged in
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const successMessage = req.query.successMessage || '';
        res.sendFile(path_1.default.join(__dirname, '../views/dashboard.html')); // Send the dashboard.html from the views folder
    }
    catch (err) {
        return res.status(500).send('Internal Server Error');
    }
}));
// Logout user
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token').redirect('/');
});
module.exports = router;
