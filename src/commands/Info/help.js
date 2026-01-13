const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "help",
  aliases: ["h"],
  description: "Displays the bot's help menu",
  category: "Info",

  run: async (client, message, args, prefix) => {

    const categories = {};
    const basePath = path.join(__dirname, "..");
    const folders = fs.readdirSync(basePath);

    for (const folder of folders) {
      const folderPath = path.join(basePath, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));
      const commands = files.map(f => {
        const cmd = require(path.join(folderPath, f));
        return cmd.name || f.replace(".js", "");
      });
      categories[folder] = commands;
    }

    const totalCmds = Object.values(categories).flat().length;

    const overviewEmbed = new EmbedBuilder()
      .setColor("#bb00ff")
      .setAuthor({
        name: "Lunexa Help Module",
        iconURL: client.user.displayAvatarURL(),
      })
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setDescription(`
Hey **${message.author.username}**, I am **Lunexa Music**

> <:dott:1438364553535684703> **Prefix:** \`${prefix}\`
> <:dott:1438364553535684703> **Total Commands:** \`${totalCmds}\`
> <:dott:1438364553535684703> **Developer** <@1390894184512356392>

__Select a category from below__
`)
      .addFields(
        {
          name: "<a:dance:1433819488368988222> __Commands__",
          value: [
            "> **Information**",
            "> **Music**",
            "> **Filters**",
            "> **Playlist**",
            "> **Settings**",
            "> **Voice**"
          ].join("\n"),
          inline: true,
        },
        {
          name: "<a:dance:1433819488368988222> __Commands__",
          value: [
            "> **Moderation**",
            "> **Admin**",
            "> **Giveaway**",
            "> **Welcome**",
            "> **Extra**",
            "> **Fun**"
          ].join("\n"),
          inline: true,
        },
      )
      .setImage("https://media.discordapp.net/attachments/1390938110929666058/1434405765321592842/Profile_Banner_1.png")
      .setFooter({
        text: "Lunexa is Love",
        iconURL: message.author.displayAvatarURL(),
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_category")
      .setPlaceholder("Select a category")
      .addOptions(
        Object.keys(categories).map(cat => ({
          label: cat,
          value: cat,
          description: `${cat} commands`,
        }))
      );

    const menuRow = new ActionRowBuilder().addComponents(selectMenu);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("home")
        .setLabel("Home")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("delete")
        .setLabel("Delete")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("all_commands")
        .setLabel("All Commands")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setLabel("Hosting")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/nexcloud")
    );

    const msg = await message.channel.send({
      embeds: [overviewEmbed],
      components: [buttons, menuRow],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 180000,
    });

    collector.on("collect", async (interaction) => {
      const id = interaction.customId;

      if (id === "home") {
        return interaction.update({
          embeds: [overviewEmbed],
          components: [buttons, menuRow],
        });
      }

      if (id === "delete") {
        collector.stop();
        return msg.delete().catch(() => {});
      }

      if (id === "help_category") {
        const category = interaction.values[0];
        const cmds = categories[category] || [];

        const catEmbed = new EmbedBuilder()
          .setColor("#bb00ff")
          .setAuthor({
            name: `${category} Commands`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
          .setDescription(
            cmds.length ? cmds.map(c => `\`${c}\``).join(", ") : "_No commands available_"
          )
          .setImage("https://media.discordapp.net/attachments/1390938110929666058/1434405765321592842/Profile_Banner_1.png")
          .setFooter({
            text: "Use dropdown to switch categories.",
            iconURL: interaction.user.displayAvatarURL(),
          });

        return interaction.update({
          embeds: [catEmbed],
          components: [buttons, menuRow],
        });
      }

      if (id === "all_commands") {
        const allEmbed = new EmbedBuilder()
          .setColor("#bb00ff")
          .setAuthor({
            name: "✨ Lunexa Commands",
            iconURL: client.user.displayAvatarURL(),
          })
          .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
          .setDescription("> Below is a complete list of all commands by category.\n")
          .addFields(
            Object.entries(categories).map(([cat, cmds]) => ({
              name: `<a:dance:1433819488368988222> ${cat} Commands`,
              value: cmds.length > 0
                ? cmds.map(c => `\`${c}\``).join(", ")
                : "_No commands available_",
              inline: false,
            }))
          )
          .setImage("https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png")
          .setFooter({
            text: "Lunexa is Love",
            iconURL: message.author.displayAvatarURL(),
          });

        return interaction.update({
          embeds: [allEmbed],
          components: [buttons, menuRow],
        });
      }
    });

    collector.on("end", () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
