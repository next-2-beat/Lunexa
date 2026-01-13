const mongoose = require("mongoose");

const PremiumGuildSchema = new mongoose.Schema({
    Guild: String,
    Expire: Number,
    Permanent: Boolean,
});

module.exports = mongoose.model("premium-guild", PremiumGuildSchema);
