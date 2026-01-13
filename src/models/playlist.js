const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  title: { type: String }, // removed `required: true`
  url: { type: String },   // removed `required: true`
});

const playlistSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  playlists: [
    {
      name: { type: String, required: true },
      songs: [songSchema],
    },
  ],
});

module.exports = mongoose.model("Playlist", playlistSchema);
