const mongoose = require("mongoose");

const VcStatusSchema = new mongoose.Schema({
  guildID: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false }
});

module.exports = mongoose.model("VcStatus", VcStatusSchema);