const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        password: { type: String, required: true },
        points: { type: Number, default: 0 }, // Points field for tracking user points
    },
    { versionKey: false } // Disable the __v field
);

const User = mongoose.model('User', userSchema);

module.exports = User;
