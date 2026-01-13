const mongoose = require("mongoose");

const restrictionSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  restrictedTextChannels: {
    type: [String],
    default: [],
  },
  restrictedVoiceChannels: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Restriction", restrictionSchema);
