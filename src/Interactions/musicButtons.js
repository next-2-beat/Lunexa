const { InteractionType } = require("discord.js");

module.exports = async (client, interaction) => {
  if (interaction.type !== InteractionType.MessageComponent) return;

  const allowedCustomIds = ["play_now", "upcoming", "remove_song"];
  if (!allowedCustomIds.includes(interaction.customId)) return;

  // Ye interaction `play.js` ke collector se handle hota hai,
  // isliye yahan kuch reply/update nahi karna hai

  // But agar interaction collector ke scope me nahi aaya
  // tab ye default message bhej dena (fallback ke liye)
  try {
    await interaction.reply({
      content: "❗This button is no longer active or already handled.",
      ephemeral: true,
    });
  } catch (e) {
    // Ignore already responded interaction
  }
};