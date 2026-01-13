const mongoose = require("mongoose");

const BadgeSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Discord User ID
    badges: { type: [String], default: [] }   // List of badges
});

module.exports = mongoose.model("badges", BadgeSchema);
