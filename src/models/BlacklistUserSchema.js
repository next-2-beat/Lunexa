const mongoose = require("mongoose");

const BlacklistUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true } // Ensure userId is unique and required
});

module.exports = mongoose.model("BlacklistUser", BlacklistUserSchema); // Capitalized model name
