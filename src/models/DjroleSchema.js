const mongoose = require("mongoose");

const DjroleSchema = new mongoose.Schema({
  guildId: { type: String },
  roleId: { type: String },
});

module.exports = mongoose.model("dj", DjroleSchema, "dj");
