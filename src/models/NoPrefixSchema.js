const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  expireAt: { type: Number, default: null },
});
module.exports = mongoose.model("NoPrefix", schema);