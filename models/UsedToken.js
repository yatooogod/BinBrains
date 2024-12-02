const mongoose = require('mongoose');

// Define the schema for used tokens
const usedTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    usedAt: { type: Date, default: Date.now },
});

// Create the model
const UsedToken = mongoose.model('UsedToken', usedTokenSchema);

module.exports = UsedToken;
