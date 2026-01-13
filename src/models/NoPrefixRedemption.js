const mongoose = require("mongoose");

const NoPrefixRewardSchema = new mongoose.Schema({

  userId: { type: String, required: true, unique: true },

  expiresAt: { type: Date, required: true },

});

module.exports = mongoose.model("NoPrefixReward", NoPrefixRewardSchema);