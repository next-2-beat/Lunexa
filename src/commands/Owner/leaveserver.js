const { EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, StringSelectMenuBuilder} = require("discord.js");
module.exports = {
  name: "leaveserver",
  aliases: ["gl", "gleave"],
  cooldown: 5, // Cooldown to prevent spam
  category: "owner",
  usage: "<server_id>",
  description: "Makes the bot leave a specified server.",
  args: true,
  vote: false,
  new: false,
  admin: true,
  owner: true, // Restrict to bot owners
  botPerms: [],
  userPerms: [],
  execute: async (client, message, args, emoji) => {
    try {
      // Check if the user is authorized
      const owners = client.config.owners || ["1390894184512356392"]; // Replace with your bot's owner IDs
      if (!owners.includes(message.author.id)) {
        return message.reply({
          embeds: [
            new client.embed()
              .setDescription(
                `**You are not authorized to use this command.**`
              )
              .setColor("Red"),
          ],
        });
      }

      // Get server ID from arguments
      const serverId = args[0];
      const guild = client.guilds.cache.get(serverId);

      if (!guild) {
        return message.reply({
          embeds: [
            new client.embed()
              .setDescription(
                `**I couldn't find a server with the ID: \`${serverId}\`**`
              )
              .setColor("Red"),
          ],
        });
      }

      // Confirm the action with the user
      await message.reply({
        embeds: [
          new client.embed()
            .setTitle(`Confirmation Required`)
            .setDescription(
              `Are you sure you want me to leave the server **${guild.name}** (${guild.id})?`
            )
            .setColor("Yellow"),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new client.button().danger("confirm_leave", "Yes"),
            new client.button().secondary("cancel_leave", "Cancel")
          ),
        ],
      });

      const filter = (interaction) =>
        interaction.user.id === message.author.id &&
        ["confirm_leave", "cancel_leave"].includes(interaction.customId);

      const collector = message.channel.createMessageComponentCollector({
        filter,
        time: 15000, // 15 seconds to respond
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "confirm_leave") {
          // Leave the guild
          await guild.leave();
          await interaction.reply({
            embeds: [
              new client.embed()
                .setDescription(
                  `**I have successfully left the server: \`${guild.name}\` (${guild.id})**`
                )
                .setColor("Green"),
            ],
          });
        } else if (interaction.customId === "cancel_leave") {
          await interaction.reply({
            embeds: [
              new client.embed()
                .setDescription(`**Action canceled.**`)
                .setColor("Blue"),
            ],
            ephemeral: true,
          });
        }

        collector.stop();
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          message.reply({
            embeds: [
              new client.embed()
                .setDescription(
                  `**You did not respond in time. Action canceled.**`
                )
                .setColor("Red"),
            ],
            components: [],
          });
        }
      });
    } catch (error) {
      console.error("Error executing leaveserver command:", error);
      await message.reply({
        embeds: [
          new client.embed()
            .setDescription(
              `**An error occurred while executing this command. Please try again later.**`
            )
            .setColor("Red"),
        ],
      });
    }
  },
};