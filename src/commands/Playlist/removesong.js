const { EmbedBuilder } = require("discord.js");
const manager = require("../../utils/playlistManager");

module.exports = {
  name: "removesong",
  description: "Remove a song from a playlist",

  async execute(client, message, args) {
    const [playlistName, ...songParts] = args;
    const query = songParts.join(" ");

    if (!playlistName || !query) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("<:cross:1433807192003444848> | Usage: `!removesong <playlist> <song name or link>`"),
        ],
      });
    }

    try {
      const success = await manager.removeSong(message.guild.id, playlistName, query);

      if (!success) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription("<:warn:1433812979349983232> | Playlist or song not found."),
          ],
        });
      }

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`<:check:1433806961773903914> | Removed **${query}** from playlist **${playlistName}**.`),
        ],
      });
    } catch (err) {
      console.error("[PLAYLIST] Error:", err);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("<:cross:1433807192003444848> | Something went wrong while removing the song."),
        ],
      });
    }
  },
};
