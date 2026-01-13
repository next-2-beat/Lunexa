const { EmbedBuilder, WebhookClient } = require("discord.js");
const client = require("..");
const web = new WebhookClient({ url: `${client.config.leave_log}` });

// Default fake users
client.fakeUsers = client.fakeUsers || 0;

module.exports = async (client) => {
  client.on("guildDelete", async (guild) => {
    try {
      // Real Users
      const realUsers = client.guilds.cache.reduce(
        (acc, g) => acc + (g.memberCount || 0),
        0
      );

      // Combined Total
      const totalUsers = realUsers + client.fakeUsers;

      // Total Servers
      const totalGuilds = client.guilds.cache.size;

      // ========== Custom Banner ==========
      const bannerURL = "https://media.discordapp.net/attachments/1390938110929666058/1434405765321592842/Profile_Banner_1.png?ex=69175f38&is=69160db8&hm=469fde8bb5d4acc76fb9ae576d2d54286f2e0d070bdb7381cf7430c71b1daa09&=&format=webp&quality=lossless&width=304&height=54"; // Replace this with your image

      // ========== Embed ==========
      const em = new EmbedBuilder()
        .setTitle(`Guild Left`)
        .setColor(client.color || 0x2b2d31)
        .setAuthor({
          name: `${client.user.username}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setThumbnail(guild.iconURL({ dynamic: true })) // server icon
        .setImage(bannerURL) // custom banner added
        .addFields([
          {
            name: `Guild Info`,
            value: `Guild Name: ${guild.name}\nGuild Id: ${
              guild.id
            }\nGuild Created: <t:${Math.round(
              guild.createdTimestamp / 1000
            )}:R>\nMemberCount: ${guild.memberCount} Members`,
          },
          {
            name: `Bot Info`,
            value: `**Servers:** ${totalGuilds}\n**Users:** ${totalUsers.toLocaleString()}`,
          },
        ])
        .setTimestamp();

      // Send to webhook
      await web.send({ embeds: [em] });
    } catch (error) {
      console.log("Error sending guild left webhook:", error);
    }
  });
};
