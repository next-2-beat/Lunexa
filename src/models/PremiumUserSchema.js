const mongoose = require("mongoose");

const PremiumUserSchema = new mongoose.Schema({
    UserID: { type: String, required: true, unique: true }, // User ID of the premium user
    ExpiresAt: { type: Date, required: true }, // Expiration date of the premium subscription
    MaxServers: { type: Number, required: true, default: 1 }, // Maximum servers the user can activate premium on
    ActivatedGuilds: { type: [String], default: [] } // List of guild IDs where the user activated premium
});

module.exports = mongoose.model("PremiumUser", PremiumUserSchema);