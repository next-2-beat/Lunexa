const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const setup = require("../models/SetupSchema.js");

const updateMessage = async (player, client, track) => {
  const updateData = await setup.findOne({ guildId: player.guildId });
  if (updateData) {
    try {
      const channel = await client.channels.fetch(updateData.channelId);
      const message = await channel.messages.fetch(updateData.messageId);
      const title = track
        ? `>>> ${client.emoji.playing} **Now Playing**: **[${
            track.title.length > 50
              ? track.title.slice(0, 50) + "..."
              : track.title || "Unknown Track"
          }](${client.config.ssLink})**\n${client.emoji.requester} **Requestor**: ${
            track.requester || "**Lunexa**"
          } `
        : "__**Join a Voice Channel & Request a Song**__\n**Elevate Your Music Experience with Lunexa**: Join Vc & Request a Song. We are here to Deliver The High Quality Music For You!";

      let embedl = new EmbedBuilder()
        .setColor(client.color)
        .setImage(`https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png?ex=6906285d&is=6904d6dd&hm=be6fb1bef07b8641d8501a618ffca7068822a299f8f7733e6d6bae741c646b99&=&format=webp&quality=lossless&width=544&height=192`)

      let embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(title)
        .setImage(`${client.config.setupBgLink}`)
        .setAuthor({
          name: `Lunexa - Requests`,
          iconURL: message.guild.iconURL({ dynamic: true }),
        })
        .setFooter({
          text: `| Thanks for choosing ${client.user.username}`,
          iconURL: `https://media.discordapp.net/attachments/1433815205296734258/1433827595581128817/Logo.gif?ex=69061b82&is=6904ca02&hm=437ba74a10d6309dd8ab9583b06ec1e926523cce8e9a6f257ba4499db179613e&=&width=410&height=410`,
        });

      const filterRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("filterSelect")
          .setPlaceholder("Select a filter")
          .addOptions(
            {
              label: "Bass Boost",
              description: "Apply a bass boost filter",
              value: "bassboost",
              emoji: "<:filter:1433864705402863878>",
            },
            {
              label: "Nightcore",
              description: "Apply a nightcore filter",
              value: "nightcore",
              emoji: "<:filter:1433864705402863878>",
            },
            {
              label: "Vaporwave",
              description: "Apply a vaporwave filter",
              value: "vaporwave",
              emoji: "<:filter:1433864705402863878>",
            },
            {
              label: "Tremolo",
              description: "Apply a tremolo filter",
              value: "tremolo",
              emoji: "<:filter:1433864705402863878>",
            },
            {
              label: "Vibrato",
              description: "Apply a vibrato filter",
              value: "vibrato",
              emoji: "<:filter:1433864705402863878>",
            },
            {
              label: "Karaoke",
              description: "Apply a karaoke filter",
              value: "karaoke",
              emoji: "<:filter:1433864705402863878>",
            },
            {
              label: "Distortion",
              description: "Apply a distortion filter",
              value: "distortion",
              emoji: "<:filter:1433864705402863878>",
            },
            {
              label: "None",
              description: "Remove all filters",
              value: "none",
              emoji: "<:filter:1433864705402863878>",
            }
          )
      );

      const row = new ActionRowBuilder()
        .addComponents(
        new ButtonBuilder()
          .setCustomId("setup_vol+")
          .setLabel("Vol+")
          .setStyle(ButtonStyle.Success)
        )
        .addComponents(
        new ButtonBuilder()
          .setCustomId("setup_pause")
          .setLabel(!player.paused ? "Resume" : "Pause")
          .setStyle(ButtonStyle.Primary)
        )
        .addComponents(
         new ButtonBuilder()
           .setCustomId("setup_skip")
           .setLabel("Skip")
           .setStyle(ButtonStyle.Secondary)
        )
        .addComponents(
        new ButtonBuilder()
          .setCustomId("setup_vol-")
          .setLabel("Vol-")
          .setStyle(ButtonStyle.Danger)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
        new ButtonBuilder()
          .setCustomId("setup_shuffle")
          .setLabel("Shuffle")
          .setStyle(ButtonStyle.Success)
        )
        .addComponents(
        new ButtonBuilder()
          .setCustomId("setup_replay")
          .setLabel("Replay")
          .setStyle(ButtonStyle.Primary)
        )
        .addComponents(
        new ButtonBuilder()
          .setCustomId("setup_clear")
          .setLabel("Clear")
          .setStyle(ButtonStyle.Secondary)
        )
        .addComponents(
        new ButtonBuilder()
          .setCustomId("setup_stop")
          .setLabel("X")
          .setStyle(ButtonStyle.Danger)
        )
      await message.edit({
        embeds: [embedl, embed],
        components: [filterRow, row, row2],
      });
    } catch (error) {
      console.error("Error editing message:", error);
    }
  }
};

module.exports = updateMessage;
