require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());  // Add cookie-parser to handle cookies
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files like script.js, style.css, etc.
app.set('views', path.join(__dirname, 'views'));  // Set the views directory for templates
app.engine('html', require('ejs').renderFile);  // Set EJS engine for rendering HTML files
app.use('/images', express.static(path.join(__dirname, 'images')));  // Serve images directory
app.set('view engine', 'html');  // Set the view engine to 'html'

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);  // Use userRoutes for handling requests

// SSL Certificate paths (for HTTPS)
const sslOptions = {
    key: fs.readFileSync('C:/Users/PC/Documents/ssl certificates/server.key'),  // Path to your server key
    cert: fs.readFileSync('C:/Users/PC/Documents/ssl certificates/server.crt')  // Path to your certificate
};

// Start the HTTPS server on the specified port (default 3000)
const PORT = process.env.PORT || 3000;
https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server running at https://localhost:${PORT}`);
});
