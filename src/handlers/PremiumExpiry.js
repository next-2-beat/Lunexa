const schema = require("../models/PremiumGuildSchema");

module.exports = async (client) => {
  setInterval(async () => {
    const now = Date.now();

    const expired = await schema.find({
      Permanent: false,
      Expire: { $lte: now }
    });

    for (const data of expired) {
      const guild = client.guilds.cache.get(data.Guild);
      if (guild) {
        const me = guild.members.me;
        if (me && me.manageable) {
          await me.setNickname(null).catch(() => {});
        }
      }
      await schema.deleteOne({ Guild: data.Guild });
      console.log(`Premium expired for guild: ${data.Guild}`);
    }
  }, 1000 * 60 * 5); // check every 5 minutes
};