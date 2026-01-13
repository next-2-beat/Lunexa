const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  name: "serverlink",
  aliases: ["slink"],
  description: "Get an invite link from a server using its ID.",
  category: "Owner",
  args: true,
  usage: "<guild_id>",
  ownerOnly: true,

  run: async (client, message, args) => {
    const guildId = args[0];
    if (!guildId) return message.reply({ content: "Please provide a guild ID." });

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return message.reply({ content: "Bot is not in that guild or the ID is invalid." });

    let inviteLink;

    try {
      const invites = await guild.invites.fetch();
      inviteLink = invites.first()?.url;
    } catch (_) {
      // Ignored, try creating instead
    }

    if (!inviteLink) {
      const channel = guild.channels.cache.find(
        ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite)
      );

      if (!channel) {
        return message.reply({ content: "No channel found to create an invite in that guild." });
      }

      try {
        const invite = await channel.createInvite({
          maxAge: 0,
          maxUses: 0,
          reason: "Requested server link",
        });
        inviteLink = invite.url;
      } catch (err) {
        return message.reply({ content: "Failed to create an invite. Missing permissions?" });
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Open Server Invite")
        .setStyle(ButtonStyle.Link)
        .setURL(inviteLink)
    );

    return message.reply({
      content: `Here is the invite link for **${guild.name}**:\n${inviteLink}`,
      components: [row],
    });
  },
};