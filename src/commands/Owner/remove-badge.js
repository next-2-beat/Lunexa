const Badge = require("../../models/BadgeSchema"); // Adjust path as needed

const badgeEmojiMap = {
    "Owner": "<:check:1433806961773903914>"
};

module.exports = {
    name: "remove-badge",
    description: "Remove a badge from a user",
    category: "Badges",
    ownerOnly: true, // Only authorized users can use this command
    run: async (client, message, args) => {
        const member = message.mentions.users.first();
        const badge = args[1];

        if (!member || !badge) {
            return message.channel.send("Please mention a user and specify a badge.");
        }

        let userBadges = await Badge.findOne({ userId: member.id });

        const emojiBadge = `${badgeEmojiMap[badge]}・${badge}`;

        if (!userBadges || !userBadges.badges.includes(emojiBadge)) {
            return message.channel.send("User does not have this badge.");
        }

        userBadges.badges = userBadges.badges.filter(b => b !== emojiBadge);
        await userBadges.save();

        return message.channel.send(`Badge **${emojiBadge}** has been removed from **${member.tag}**.`);
    }
};
