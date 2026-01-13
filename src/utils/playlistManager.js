const Playlist = require("../models/playlist.js");

/**
 * ✅ Utility: Normalize all songs to { title, url } format
 * Converts old string-based entries to valid objects for consistency.
 */
function normalizeSongs(songs) {
  return songs.map((s) => {
    if (typeof s === "string") {
      // legacy string entry
      if (s.startsWith("http")) {
        return { title: s, url: s }; // if it’s a link, keep as both
      } else {
        return { title: s, url: "unknown" }; // if just a name, mark url unknown
      }
    }

    // already an object, fix missing fields
    return {
      title: s.title || "Unknown Title",
      url: s.url || "unknown",
    };
  });
}

module.exports = {
  /** 🎵 Create a new playlist for a guild */
  async createPlaylist(guildId, name) {
    let guildData = await Playlist.findOne({ guildId });
    if (!guildData) guildData = new Playlist({ guildId, playlists: [] });

    const exists = guildData.playlists.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) return false;

    guildData.playlists.push({ name, songs: [] });
    await guildData.save();
    return true;
  },

  /** ➕ Add a song object { title, url } to a playlist */
  async addSong(guildId, name, song) {
    const guildData = await Playlist.findOne({ guildId });
    if (!guildData) return false;

    const playlist = guildData.playlists.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!playlist) return false;

    // Normalize old entries to prevent validation errors
    playlist.songs = normalizeSongs(playlist.songs);

    // Push new song in clean format
    playlist.songs.push({
      title: song.title || "Unknown Title",
      url: song.url || "unknown",
    });

    await guildData.save().catch((err) =>
      console.warn("[playlistManager] Save error:", err)
    );

    return true;
  },

  /** ❌ Remove a song by name, partial title, or URL */
  async removeSong(guildId, name, songQuery) {
    const guildData = await Playlist.findOne({ guildId });
    if (!guildData) return false;

    const playlist = guildData.playlists.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!playlist) return false;

    playlist.songs = normalizeSongs(playlist.songs);

    const beforeCount = playlist.songs.length;

    // Case-insensitive flexible match
    playlist.songs = playlist.songs.filter((s) => {
      const title = s.title.toLowerCase();
      const url = s.url.toLowerCase();
      const query = songQuery.toLowerCase();

      // Keep song if it does NOT match
      return (
        title !== query &&
        url !== query &&
        !title.includes(query) && // also supports partial name match
        !url.includes(query)
      );
    });

    const afterCount = playlist.songs.length;
    if (beforeCount === afterCount) return false; // nothing removed

    await guildData.save();
    return true;
  },

  /** 📜 List all songs (normalized clean data) */
  async listSongs(guildId, name) {
    const guildData = await Playlist.findOne({ guildId });
    if (!guildData) return null;

    const playlist = guildData.playlists.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!playlist) return null;

    playlist.songs = normalizeSongs(playlist.songs);
    return playlist.songs;
  },

  /** 🗑️ Delete a playlist completely */
  async deletePlaylist(guildId, name) {
    const guildData = await Playlist.findOne({ guildId });
    if (!guildData) return false;

    const beforeCount = guildData.playlists.length;
    guildData.playlists = guildData.playlists.filter(
      (p) => p.name.toLowerCase() !== name.toLowerCase()
    );

    if (guildData.playlists.length === beforeCount) return false; // playlist not found

    await guildData.save();
    return true;
  },
};
