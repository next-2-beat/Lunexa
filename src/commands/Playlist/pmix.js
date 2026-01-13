const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const Playlist = require("../../models/playlist.js");
const updateQueue = require("../../handlers/setupQueue.js");

/**
 * Try to extract a YouTube video ID from a url and return a thumbnail URL.
 */
function getYoutubeThumbnail(url) {
  try {
    if (!url || typeof url !== "string") return null;
    const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (short && short[1]) return `https://img.youtube.com/vi/${short[1]}/hqdefault.jpg`;
    const v = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (v && v[1]) return `https://img.youtube.com/vi/${v[1]}/hqdefault.jpg`;
    const emb = url.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
    if (emb && emb[1]) return `https://img.youtube.com/vi/${emb[1]}/hqdefault.jpg`;
    return null;
  } catch {
    return null;
  }
}

module.exports = {
  name: "pmix",
  aliases: ["playlistmix", "mix"],
  description: "Select and play your playlists with elegance and style.",
  category: "Music",
  inVc: true,
  sameVc: true,
  dj: true,
  premium: false,

  run: async (client, message, args, prefix) => {
    const channel = message.member.voice.channel;
    if (!channel)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("<:cross:1433807192003444848> | You need to join a voice channel first!"),
        ],
      });

    const guildData = await Playlist.findOne({ guildId: message.guild.id });
    if (!guildData || !guildData.playlists.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              "<:warn:1433812979349983232> | No playlists found for this server! Create one using `!createplaylist <name>`"
            ),
        ],
      });
    }

    // Build dropdown options
    const options = guildData.playlists.map((pl) => ({
      label: pl.name,
      description: `${(pl.songs && pl.songs.length) || 0} song(s)`,
      value: pl.name,
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId("playlist_select")
      .setPlaceholder("Select a playlist to play")
      .addOptions(options.slice(0, 25));

    const row = new ActionRowBuilder().addComponents(select);

    // 🎨 Enhanced Embed Description with Vibes
    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle("<a:playing:1433858583115726970> Playlist Mixer")
      .setThumbnail("https://images-ext-1.discordapp.net/external/AZH0LHaHdtQgiPGOcvJJlLBz1elGrFY92p2cqHNj-mg/%3Fformat%3Dwebp%26width%3D205%26height%3D205/https/images-ext-1.discordapp.net/external/VCKUxOH1ClbqPKETMazyfJztt1isFIoRxNxbbiwElRs/%253Fsize%253D256/https/cdn.discordapp.com/avatars/1390965840437968896/38840bc34bc8b63f483caa00895ac982.webp?format=webp&width=154&height=154")
      .setImage("https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png?format=webp&quality=lossless&width=544&height=192")
      .setDescription(`
> "Music gives a soul to the universe, wings to the mind, flight to the imagination, and life to everything."

> Welcome to **Lunexa Playlist Mixer**, where your melodies meet magic. Select your playlist below to begin an immersive musical journey.  

> Whether it's lo-fi beats for focus, energetic vibes for gaming, or emotional waves for the soul — every playlist tells a story. Choose your soundtrack and let the rhythm take control.  
`)
      .setFooter({
        text: `Requested by ${message.author.username} • Let’s turn moments into melodies`,
        iconURL: message.author.displayAvatarURL(),
      });

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.customId === "playlist_select" && i.user.id === message.author.id,
      time: 60_000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferReply({ ephemeral: true }).catch(() => {});

      const selectedName = interaction.values[0];
      const playlist = guildData.playlists.find((p) => p.name === selectedName);

      if (!playlist || !playlist.songs || playlist.songs.length === 0) {
        return interaction.editReply({
          content: "<:warn:1433812979349983232> | This playlist has no songs!",
          ephemeral: true,
        });
      }

      const node = client.manager.nodeMap?.values().next().value;
      if (!node) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription("<:cross:1433807192003444848> | No Lavalink nodes available right now!"),
          ],
          ephemeral: true,
        });
      }

      const player = client.manager.createConnection({
        guildId: message.guild.id,
        voiceChannel: channel.id,
        textChannel: message.channel.id,
        volume: 80,
        deaf: true,
      });

      await interaction.editReply({
        content: `Loading your playlist **${playlist.name}**... Please hold on, maestro.`,
        ephemeral: true,
      });

      let added = 0;
      let firstResolvedTrack = null;

      for (const entry of playlist.songs) {
        const query = entry && typeof entry === "object" ? entry.url || entry.title : entry;
        if (!query) continue;

        try {
          const res = await client.manager.resolve({
            query,
            node,
            requester: message.author,
          });

          if (res && res.tracks && res.tracks.length) {
            const track = res.tracks[0];
            track.requester = message.author;
            player.queue.add(track);
            added++;
            if (!firstResolvedTrack) firstResolvedTrack = track;
          }
        } catch (err) {
          console.error(`[PLAYLIST] Failed to load query: ${query}`, err);
        }
      }

      if (!player.playing && !player.paused && player.queue.size > 0) {
        try {
          await player.play();
        } catch (playErr) {
          console.error("[PLAYLIST] Error starting playback:", playErr);
        }
      }

      await updateQueue(message.guild, player.queue);

      // ✅ Enhanced final embed with visuals and emotion
      const successEmbed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("Playlist Loaded Successfully!")
        .setDescription(`
<:check:1433806961773903914> | Loaded **${added}** tracks from **${playlist.name}**

> _When words fail, music speaks."_   

**Now Playing:**  
${firstResolvedTrack ? `[${firstResolvedTrack.info.title}](${firstResolvedTrack.info.uri})` : "Unknown track"}

**Requested by:** ${message.author}
        `)
        .setFooter({ text: "Sit back, relax, and enjoy your tunes 🎧" });

      let thumbnail = null;
      if (firstResolvedTrack) {
        thumbnail = firstResolvedTrack.info?.thumbnail || getYoutubeThumbnail(firstResolvedTrack.info?.uri);
      }
      if (thumbnail) successEmbed.setThumbnail(thumbnail);

      // Add an image banner if available
      successEmbed.setImage(
        "https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png?format=webp&quality=lossless&width=544&height=192"
      );

      await message.channel.send({ embeds: [successEmbed] });

      try {
        await interaction.followUp({
          content: `Playlist **${playlist.name}** is now playing. Enjoy the rhythm!`,
          ephemeral: true,
        });
      } catch {}
    });

    collector.on("end", () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
