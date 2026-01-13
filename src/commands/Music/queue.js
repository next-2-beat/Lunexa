const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "queue",
  aliases: ["q", "list"],
  description: "Show the current music queue",
  category: "Music",
  owner: false,

  run: async (client, message, args, prefix) => {
    try {
      const player = client.manager.players.get(message.guild.id);
      if (!player) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setAuthor({ name: "No Player Found" })
              .setDescription("There is no active player in this server."),
          ],
        });
      }

      // yaha fix kiya hai
      const currentTrack = player.current
        ? `**Now Playing:** [${player.current.info.title}](${player.current.info.uri}) [${player.current.info.author}]`
        : "Nothing is currently playing.";

      const tracks = player.queue
        .slice(0) // first item is current, isliye usko hata diya
        .map(
          (track, i) =>
            `\`${i + 1}\` • [${track.info.title}](${track.info.uri}) [${track.info.author}]`
        );

      if (!player.current && !tracks.length) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setAuthor({ name: "Empty Queue" })
              .setDescription("The queue is currently empty."),
          ],
        });
      }

      // Pagination setup
      const chunkSize = 10;
      const totalPages = Math.ceil(tracks.length / chunkSize) || 1;
      let page = 0;

      const generateEmbed = (page) => {
        const start = page * chunkSize;
        const end = start + chunkSize;
        const queuePage = tracks.slice(start, end);

        return new EmbedBuilder()
          .setColor(client.color)
          .setAuthor({
            name: `${message.guild.name} | Music Queue`,
            iconURL: message.guild.iconURL(),
          })
          .setDescription(
            `${page === 0 ? currentTrack + "\n\n" : ""}${
              queuePage.length
                ? queuePage.join("\n")
                : "No upcoming tracks in queue."
            }`
          )
          .setFooter({
            text: `Page ${page + 1} of ${totalPages} • Total Tracks: ${tracks.length}`,
          });
      };

      // Buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(totalPages <= 1)
      );

      const msg = await message.channel.send({
        embeds: [generateEmbed(page)],
        components: [row],
      });

      // Collector
      const collector = msg.createMessageComponentCollector({
        time: 60 * 1000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id)
          return interaction.reply({
            content: "Only the command user can control the queue slider.",
            ephemeral: true,
          });

        if (interaction.customId === "prev") {
          page = page > 0 ? page - 1 : page;
        } else if (interaction.customId === "next") {
          page = page + 1 < totalPages ? page + 1 : page;
        }

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page + 1 === totalPages)
        );

        await interaction.update({
          embeds: [generateEmbed(page)],
          components: [newRow],
        });
      });

      collector.on("end", async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        await msg.edit({
          components: [disabledRow],
        });
      });
    } catch (error) {
      console.log(error);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setAuthor({ name: "Error" })
            .setDescription(
              "An unexpected error occurred while showing the queue."
            ),
        ],
      });
    }
  },
};
