const mongoose = require("mongoose");

const IgnoreChannelSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
});

module.exports = mongoose.model("IgnoreChannel", IgnoreChannelSchema);
