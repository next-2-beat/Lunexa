const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: "search",
  description: `Search a song based on your interest!`,
  premium: false,

  run: async (client, message, args, prefix, player) => {
    const tick = "<:check:1433806961773903914>";
    const cross = "<:cross:1433807192003444848>";
    const warn = "<:warn:1433812979349983232>";

    const query = args.join(" ");
    if (!query) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${warn} | Usage: \`${prefix}search <song name>\``),
        ],
      });
    }

    try {
      await message.channel.sendTyping();
      const node = client.manager.nodeMap?.values().next().value;
      if (!node) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("<:cross:1433807192003444848> No Lavalink nodes are available!")
              .setColor(client.config.color),
          ],
        });
      }

      const result = await client.manager.resolve({
        query: query,
        source: "ytmsearch",
        requester: message.author,
        node: node
      });

      if (!result.tracks.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${cross} | No results found for \`${query}\`.`),
          ],
        });
      }

      const topTracks = result.tracks.slice(0, 10);

      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setTitle(`🔍 Search Results for: "${query}"`)
        .setDescription(
          topTracks
            .map((track, i) => `**${i + 1}.** [${track.info.title}](${track.info.uri}) • \`${track.info.author}\``)
            .join("\n")
        )
        .setFooter({ text: "Select a song from the menu below to play." });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-song')
        .setPlaceholder('Choose a song to play')
        .addOptions(
          topTracks.map((track, index) => ({
            label: track.info.title.slice(0, 25),
            description: track.info.author.slice(0, 45),
            value: index.toString(),
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const searchMessage = await message.channel.send({
        embeds: [embed],
        components: [row],
      });

      const filter = (interaction) =>
        interaction.isStringSelectMenu() &&
        interaction.customId === 'select-song' &&
        interaction.user.id === message.author.id;

      const collector = searchMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (interaction) => {
        try {
          await interaction.deferReply();

          const selectedIndex = parseInt(interaction.values[0], 10);
          const selectedTrack = topTracks[selectedIndex];

          if (!message.member.voice.channelId) {
            return interaction.editReply({
              content: `${cross} | You must be in a voice channel to play music.`,
              ephemeral: true,
            });
          }

          if (!player) {
            const node = client.manager.nodeMap?.values().next().value;
            if (!node) {
              return interaction.editReply({
                content: `${cross} | No Lavalink nodes are available!`,
                ephemeral: true,
              });
            }
            
            player = client.manager.createConnection({
              guildId: message.guild.id,
              voiceChannel: message.member.voice.channelId,
              textChannel: message.channel.id,
            });
          }

          player.queue.add(selectedTrack);
          if (!player.playing && !player.paused && !player.queue.size) player.play();

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`${tick} | Now playing: **[${selectedTrack.info.title}](${selectedTrack.info.uri})**\nBy: \`${selectedTrack.info.author}\``),
            ],
          });
        } catch (err) {
          console.error("Select menu error:", err);
          await interaction.editReply({
            content: `${cross} | An error occurred while trying to play the selected track.`,
            ephemeral: true,
          });
        }
      });

      collector.on("end", (collected) => {
        if (!collected.size) {
          searchMessage.edit({
            content: `${warn} | Search selection timed out.`,
            components: [],
          });
        }
      });

    } catch (err) {
      console.error(err);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${cross} | Something went wrong while searching.`),
        ],
      });
    }
  },
};