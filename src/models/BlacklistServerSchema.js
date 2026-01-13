const mongoose = require("mongoose");

const BlacklistServerSchema = new mongoose.Schema({
  serverId: { type: String, required: true, unique: true }, // Unique server ID
  reason: { type: String, default: "No reason provided" },  // Optional reason for blacklisting
  date: { type: Date, default: Date.now },                 // Date of blacklisting
});

module.exports = mongoose.model("BlacklistServer", BlacklistServerSchema);
