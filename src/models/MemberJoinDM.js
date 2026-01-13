const mongoose = require("mongoose");

const MemberJoinDMSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
});

module.exports = mongoose.model("MemberJoinDM", MemberJoinDMSchema);
