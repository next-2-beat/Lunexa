module.exports = {
  name: "serverlist",
  aliases: ["slist"],
  description: "Lists servers the bot is in with name, ID, and member count (plain text, sorted).",
  category: "Owner",
  ownerOnly: true,

  run: async (client, message) => {
    const guilds = client.guilds.cache
      .map(g => ({
        name: g.name,
        id: g.id,
        count: g.memberCount,
      }))
      .sort((a, b) => b.count - a.count);

    const chunkSize = 10;
    for (let i = 0; i < guilds.length; i += chunkSize) {
      const chunk = guilds.slice(i, i + chunkSize);

      const list = chunk
        .map(
          (g, index) =>
            `${i + index + 1}. ${g.name} | ID: ${g.id} | Members: ${g.count}`
        )
        .join("\n");

      await message.channel.send(`\`\`\`\n${list}\n\`\`\``);
    }
  },
};