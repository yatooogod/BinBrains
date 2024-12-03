const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        points: { type: Number, required: true }, // Points required to redeem this reward
        description: { type: String, required: true }, // Description of the reward
    },
    { versionKey: false } // Disable the __v field
);

const Reward = mongoose.model('Reward', rewardSchema);

module.exports = Reward;
