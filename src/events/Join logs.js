const {
  EmbedBuilder,
  WebhookClient,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = async (client) => {
  const web = new WebhookClient({ url: client.config.join_log });

  client.fakeUsers = client.fakeUsers || 0;

  client.on("guildCreate", async (guild) => {
    try {
      // ========== Fetch Who Invited The Bot ==========
      let inviter;
      try {
        const auditLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: 28, // BOT_ADD
        });
        const entry = auditLogs.entries.first();
        inviter = entry?.executor || null;
      } catch {
        inviter = null;
      }

      // ========== Create DM Embed ==========
      const mb = new EmbedBuilder()
        .setTitle(`Hey I am ${client.user.username}`)
        .setColor(client.color || 0x2b2d31)
        .setAuthor({
          name: `Thanks for Inviting Me`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(
          `> I come up with default prefix : \`${client.config.prefix}\`\n\n> High Quality music bot with unique features\n\n> Different search engines supported\n\n> For help or bug reporting, join our [Support Server](${client.config.ssLink})`
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Invite Me")
          .setStyle(ButtonStyle.Link)
          .setURL(`${client.invite}`),
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(ButtonStyle.Link)
          .setURL(`${client.config.ssLink}`),
        new ButtonBuilder()
          .setLabel("DBL")
          .setStyle(ButtonStyle.Link)
          .setURL(`${client.config.topGg}`)
      );

      if (inviter) {
        try {
          await inviter.send({ embeds: [mb], components: [row] });
        } catch {
          console.log(`Could not DM ${inviter.tag}`);
        }
      }

      // ========== Create Server Invite Link ==========
      let inviteLink = "Could not create invite";

      try {
        const channel = guild.channels.cache
          .filter(
            (ch) =>
              ch.type === 0 &&
              ch.permissionsFor(guild.members.me)?.has("CreateInstantInvite")
          )
          .first();

        if (channel) {
          const invite = await guild.invites.create(channel.id, {
            maxAge: 0,
            maxUses: 0,
          });

          inviteLink = invite.url;
        }
      } catch (e) {
        console.log("Failed to create server invite:", e.message);
      }

      // ========== Webhook Stats ==========
      const realUsers = client.guilds.cache.reduce(
        (acc, g) => acc + (g.memberCount || 0),
        0
      );
      const totalUsers = realUsers + client.fakeUsers;
      const totalGuilds = client.guilds.cache.size;

      let owner;
      try {
        const fetchedOwner = await guild.fetchOwner();
        owner = fetchedOwner ? fetchedOwner.user.tag : "Unknown";
      } catch {
        owner = "Unknown";
      }

      // ========== Custom Banner Image ==========
      // 🔥 Put your banner URL below
      const bannerURL = "https://media.discordapp.net/attachments/1390938110929666058/1434405765321592842/Profile_Banner_1.png?ex=69175f38&is=69160db8&hm=469fde8bb5d4acc76fb9ae576d2d54286f2e0d070bdb7381cf7430c71b1daa09&=&format=webp&quality=lossless&width=304&height=54";

      // ========== Webhook Embed ==========
      const em = new EmbedBuilder()
        .setTitle(`Guild Joined`)
        .setColor(client.color || 0x2b2d31)
        .setAuthor({
          name: `${client.user.username}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setThumbnail(guild.iconURL({ dynamic: true })) // Server icon
        .setImage(bannerURL) // Custom banner here
        .addFields([
          {
            name: `Guild Info`,
            value: `**Name:** ${guild.name}\n**ID:** ${guild.id}\n**Created:** <t:${Math.round(
              guild.createdTimestamp / 1000
            )}:R>\n**Joined:** <t:${Math.round(
              guild.joinedTimestamp / 1000
            )}:R>\n**Owner:** ${owner}\n**Members:** ${
              guild.memberCount
            }\n**Shard ID:** ${guild.shardId}`,
          },
          {
            name: `Bot Stats`,
            value: `**Servers:** ${totalGuilds}\n**Users:** ${totalUsers.toLocaleString()}`,
          },
          {
            name: `Server Invite`,
            value: inviteLink,
          },
        ])
        .setTimestamp();

      await web.send({ embeds: [em] }).catch((err) => {
        console.log("Webhook send failed:", err.message);
      });

      console.log(`[+] Joined guild: ${guild.name} (${guild.id})`);
    } catch (err) {
      console.log("Error sending guild join webhook:", err);
    }
  });
};
