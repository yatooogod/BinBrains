require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser'); // Add cookie-parser
const https = require('https');  // Import the https module
const fs = require('fs');  // Import fs for reading the SSL files

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Use cookie-parser
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files like script.js and style.css
app.set('views', path.join(__dirname, 'views'));  // Views directory for templates
app.engine('html', require('ejs').renderFile);  // Set EJS engine for rendering HTML
app.use('/images', express.static(path.join(__dirname, 'images')));
app.set('view engine', 'html');  // Set view engine to 'html'

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

// SSL Certificate paths
const sslOptions = {
    key: fs.readFileSync('C:/Users/PC/Documents/ssl certificates/server.key'),  // Path to your server key
    cert: fs.readFileSync('C:/Users/PC/Documents/ssl certificates/server.crt')  // Path to your certificate
};

// Start the HTTPS server
const PORT = process.env.PORT || 3000;
https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server running at https://localhost:${PORT}`);
});
