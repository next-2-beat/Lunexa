const mongoose = require("mongoose");

const sharedPlaylistSchema = new mongoose.Schema({
  shareId: { type: String, required: true, unique: true },
  verificationCode: { type: String, required: true },
  playlist: {
    name: String,
    songs: [
      {
        title: String,
        url: String,
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("SharedPlaylist", sharedPlaylistSchema);
