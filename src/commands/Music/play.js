const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const updateQueue = require("../../handlers/setupQueue.js");

module.exports = {
  name: "play",
  aliases: ["p"],
  description: "Play a song or playlist",
  category: "Music",
  inVc: true,
  sameVc: true,
  dj: true,
  premium: false,

  run: async (client, message, args, prefix) => {
    const channel = message.member.voice.channel;
    const query = args.join(" ");

    if (!args[0]) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setTitle("Missing Query")
            .setDescription(`<:cross:1433807192003444848> | Please provide a song name, URL or playlist.`),
        ],
      });
    }

    if (!client.hasAvailableNodes()) {
      // Even if we think no nodes are available, let's double-check
      const availableNodes = client.getAvailableNodes();
      if (availableNodes.length === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setTitle("Lavalink Error")
              .setDescription(`<:cross:1433807192003444848> | No Lavalink nodes are currently available. Please try again in a moment.`),
          ],
        });
      }
    }

    try {
      // Try to create a player - this will actually test the connection
      // For Riffy, we need to get a node first, then create the player
      const node = client.manager.nodeMap?.values().next().value;
      if (!node) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("❌ No Lavalink nodes are available!")
              .setColor(client.config.color),
          ],
        });
      }

      const player = client.manager.createConnection({
        guildId: message.guild.id,
        textChannel: message.channel.id,
        voiceChannel: channel.id,
        volume: 80,
        deaf: true,
      });

      // Perform search with better error handling and retry logic
      let result;
      let searchAttempts = 0;
      const maxSearchAttempts = 3;
      
      while (searchAttempts < maxSearchAttempts) {
        try {
          result = await client.manager.resolve({
            query: query,
            source: "ytmsearch",
            requester: message.author,
            node: node
          });
          break; // If successful, break out of the loop
        } catch (searchError) {
          searchAttempts++;
          console.error(`[PLAY_COMMAND] Search attempt ${searchAttempts} failed:`, searchError);
          
          if (searchAttempts >= maxSearchAttempts) {
            throw searchError; // Re-throw if we've exhausted all attempts
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * searchAttempts));
        }
      }

      if (!result.tracks.length) {
        // Safely destroy the player if no tracks found
        await client.destroyPlayerSafely(message.guild.id);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`<:cross:1433807192003444848> | No results found for **${query}**.`),
          ],
        });
      }

      if (result.type === "PLAYLIST") {
        for (const track of result.tracks) {
          player.queue.add(track);
        }
        
        if (!player.playing && !player.paused && player.queue.size > 0) {
          await player.play();
        }

        const playlistEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle("Playlist Queued")
          .setDescription(
            `<:check:1433806961773903914> | Added **${result.tracks.length}** songs from [${result.playlistName}](${query})`
          );

        await updateQueue(message.guild, player.queue);
        return message.reply({ embeds: [playlistEmbed] });
      }

      const track = result.tracks[0];
      track.requester = message.author; // Add requester info
      player.queue.add(track);
      
      if (!player.playing && !player.paused) {
        await player.play();
      }

      // Get track info from the correct structure
      const trackTitle = track.info?.title || track.title || "Unknown Track";
      const trackUri = track.info?.uri || track.uri || "#";
      const trackAuthor = track.info?.author || track.author || "Unknown Artist";

      const trackEmbed = new EmbedBuilder()
        .setColor(client.color)
        .setTitle("Track Queued")
        .setDescription(
          `<:check:1433806961773903914> | [${trackTitle}](${trackUri}) has been added to the queue.\nBy: \`${trackAuthor}\``
        )
        .setFooter({ text: `Requested by ${message.author.tag}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("upcoming")
          .setLabel("Add as Upcoming")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("remove_song")
          .setLabel("Remove")
          .setStyle(ButtonStyle.Danger)
      );

      const showButtons = player.queue.length >= 2;
      const sent = await message.reply({
        embeds: [trackEmbed],
        components: showButtons ? [row] : [],
      });

      // ✅ Always enable collector if buttons are sent
      if (showButtons) {
        const collector = sent.createMessageComponentCollector({
          time: 10000,
          max: 1,
        });

        collector.on("collect", async (interaction) => {
          if (!interaction.isButton()) return;
          const lastTrack = player.queue[player.queue.length - 1];

          switch (interaction.customId) {
            case "remove_song":
              player.queue.pop();
              const removedEmbed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`<:check:1433806961773903914> | Track removed from queue.`);
              await interaction.update({ embeds: [removedEmbed], components: [] });
              break;

            case "upcoming":
              const upcomingTrack = player.queue.pop();
              player.queue.splice(0, 0, upcomingTrack); // Not index 0 else it plays immediately
              const upcomingEmbed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`<:check:1433806961773903914> | Track will play after the current one.`);
              await interaction.update({ embeds: [upcomingEmbed], components: [] });
              break;
          }
        });

        collector.on("end", async (_, reason) => {
          if (reason === "time") {
            try {
              await sent.edit({ components: [] }).catch(() => {});
            } catch (editError) {
              // Ignore edit errors
            }
          }
        });
      }

      await updateQueue(message.guild, player.queue);
    } catch (error) {
      console.error("[PLAY_COMMAND] Error:", error);
      // Provide more specific error messages
      let errorMessage = "Failed to play the track. Please try again later.";
      
      if (error.message && error.message.includes("No nodes are online")) {
        errorMessage = "Lavalink node is temporarily unavailable. Please try again in a moment.";
      } else if (error.message) {
        errorMessage = `Playback error: ${error.message}`;
      }
      
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setTitle("Playback Error")
            .setDescription(`<:cross:1433807192003444848> | ${errorMessage}`),
        ],
      });
    }
  },
};