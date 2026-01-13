const { EmbedBuilder } = require("discord.js");
const manager = require("../../utils/playlistManager");

module.exports = {
  name: "addsong",
  description: "Add a song to a playlist",

  async execute(client, message, args) {
    const [playlistName, ...songParts] = args;
    const query = songParts.join(" ");

    if (!playlistName || !query) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("<:cross:1433807192003444848> | Usage: `!addsong <playlist> <song name or link>`"),
        ],
      });
    }

    // ✅ Detect user voice channel (optional for validation)
    const node = client.manager.nodeMap?.values().next().value;
    if (!node) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("<:cross:1433807192003444848> | Lavalink node is unavailable! Try again later."),
        ],
      });
    }

    // 🧠 Auto-detect source
    let source = "ytsearch"; // default
    if (/^https?:\/\//.test(query)) {
      if (query.includes("spotify.com")) source = "spsearch";
      else if (query.includes("soundcloud.com")) source = "scsearch";
      else source = "ytmsearch"; // link → usually YT Music
    }

    let songData = null;

    try {
      // 🔎 Resolve song via Lavalink
      const result = await client.manager.resolve({
        query,
        source,
        node,
      });

      // 🎵 Handle no results
      if (!result.tracks || !result.tracks.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`<:warn:1433812979349983232> | No results found for **${query}**.`),
          ],
        });
      }

      // 🎧 Choose first track
      const track = result.tracks[0];
      songData = {
        title: track.info?.title || "Unknown Title",
        url: track.info?.uri || query,
      };

      // 💾 Save song to playlist
      const success = await manager.addSong(message.guild.id, playlistName, songData);
      if (!success) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(
                "<:warn:1433812979349983232> | Playlist not found! Create one using `!createplaylist <name>` first."
              ),
          ],
        });
      }

      // ✅ Confirmation embed
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setTitle("Song Added")
        .setDescription(
          `<:check:1433806961773903914> | Added **[${songData.title}](${songData.url})** to playlist **${playlistName}**`
        )
        .setFooter({ text: `Requested by ${message.author.tag}` });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error("[PLAYLIST] Error adding song:", err);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setTitle("<:cross:1433807192003444848> | Error Adding Song")
            .setDescription(
              `Something went wrong while fetching **${query}**.\n\`\`\`${err.message}\`\`\``
            ),
        ],
      });
    }
  },
};
