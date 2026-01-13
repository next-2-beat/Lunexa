const { Schema, model } = require("mongoose");

let reconnectAuto = new Schema({
  GuildId: { type: String, required: true },
  TextId: { type: String, required: true },
  VoiceId: { type: String, required: true },
});
module.exports = model("autoreconnect", reconnectAuto);
