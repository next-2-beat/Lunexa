const Badge = require("../../models/BadgeSchema"); // Adjust path as needed

const badgeEmojiMap = {
    "Owner": "<:check:1433806961773903914>"
};

module.exports = {
    name: "add-badge",
    description: "Add a badge to a user",
    category: "Badges",
    ownerOnly: true, // Only authorized users can use this command
    run: async (client, message, args) => {
        const member = message.mentions.users.first();
        const badge = args[1];

        if (!member || !badge) {
            return message.channel.send(`${client.emoji.cross} | Please mention a user and specify a badge.`);
        }

        const badgeList = Object.keys(badgeEmojiMap);

        if (!badgeList.includes(badge)) {
            return message.channel.send(`Invalid badge. Available badges: ${badgeList.join(", ")}`);
        }

        let userBadges = await Badge.findOne({ userId: member.id });

        const emojiBadge = `${badgeEmojiMap[badge]}・${badge}`;

        if (!userBadges) {
            userBadges = new Badge({ userId: member.id, badges: [emojiBadge] });
        } else if (userBadges.badges.includes(emojiBadge)) {
            return message.channel.send(`${client.emoji.cross} | User already has this badge.`);
        } else {
            userBadges.badges.push(emojiBadge);
        }

        await userBadges.save();
        return message.channel.send(`${client.emoji.tick} | Badge **${emojiBadge}** has been added to **${member.tag}**.`);
    }
};
