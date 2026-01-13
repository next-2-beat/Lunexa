const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const setplayer = require("../models/SetupPlayerSchema.js");
const setup = require("../models/SetupSchema.js");
const updateMessage = require("../handlers/setupQueue.js");
const { createCanvas, loadImage } = require("canvas");

module.exports = async (client) => {
  const handleTrackStart = async (player, track) => {
    try {
      if (!client.manager) return;

      if (!(player.data instanceof Map)) {
        player.data = new Map(Object.entries(player.data || {}));
      }

      const playerConfig = await setplayer.findOne({ guildId: player.guildId });
      const mode = playerConfig?.playerMode || "classic";
      const updateData = await setup.findOne({ guildId: player.guildId });

      const trackTitle = track.info?.title || track.title || "Unknown Track";
      const trackAuthor = track.info?.author || track.author || "Unknown Artist";
      console.log(`Now playing: ${trackTitle} by ${trackAuthor} | Guild: ${player.guildId}`);

      await updateMessage(player, client, track);

      const textChannelId = player.textId || player.textChannel;
      const messageChannel =
        client.channels.cache.get(textChannelId) ||
        (textChannelId ? await client.channels.fetch(textChannelId).catch(() => null) : null);
      if (!messageChannel) return;

      player.previousTrack = player.currentTrack || null;
      player.currentTrack = track;

      if (mode === "classic") {
        // 🎨 Generate Canvas image
        const buffer = await createMusicCard(track, client, player);
        const attachment = new AttachmentBuilder(buffer, { name: "music-card.png" });

        const components = getPlayerButtons(player);

        // 📜 Build Embed
        const nowEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setAuthor({ name: `Now Playing`, iconURL: client.user.displayAvatarURL() })
          .setDescription(`**${trackTitle}**\nby *${trackAuthor}*`)
          .setImage("attachment://music-card.png");

        // 📨 Send message (handle missing-permissions gracefully)
        let nplaying;
        try {
          nplaying = await messageChannel.send({ embeds: [nowEmbed], files: [attachment], components });
        } catch (err) {
          // If bot lacks permission to send messages, avoid spamming console with stack traces.
          // Log a concise line and return silently.
          const isDiscordAPIError = err && err.code === 50013;
          if (isDiscordAPIError) {
            console.log(`[PERMS] No Perms Provided on ${player.guildId}`);
            // Optionally, attempt to notify server admins via guild owner DM could be added here.
            return;
          }
          // For other errors, log them for debugging
          console.error("NowPlaying send error:", err);
          return;
        }
        if (!nplaying) return;

        player.data.nplaying = nplaying;

        const filter = (i) =>
          i.guild.members.me.voice.channel &&
          i.guild.members.me.voice.channelId === i.member.voice.channelId;

        const collector = nplaying.createMessageComponentCollector({
          filter,
          time: 3600000,
        });

        collector.on("collect", async (interaction) => {
          const id = interaction.customId;
          let feedbackMessage;

          try {
            await interaction.deferUpdate();
          } catch {}

          switch (id) {
            case "pause":
              await player.pause(!player.paused);
              feedbackMessage = `Track ${player.paused ? "paused" : "resumed"}.`;
              break;
            case "skip":
              if (player.queue.size > 0) {
                await player.stop();
                feedbackMessage = `⏭️ Skipped to next track.`;
              } else {
                await client.destroyPlayerSafely(player.guildId);
                feedbackMessage = `No more tracks — stopping playback.`;
              }
              break;
            case "back":
              if (player.previousTrack) {
                await player.play(player.previousTrack);
                feedbackMessage = `⏮️ Playing previous track.`;
              } else feedbackMessage = `No previous track.`;
              break;
            case "shuffle":
              player.queue.shuffle();
              feedbackMessage = `🔀 Queue shuffled.`;
              break;
            case "loop":
              const newLoop = player.loop === "track" ? "none" : "track";
              await player.setLoop(newLoop);
              feedbackMessage = `🔁 Loop ${newLoop === "track" ? "enabled" : "disabled"}.`;
              break;
          }

          if (feedbackMessage) {
            try {
              const feedback = await interaction.channel.send({
                embeds: [
                  new EmbedBuilder()
                    .setDescription(feedbackMessage)
                    .setColor(client.color)
                    .setFooter({ text: `Executed by ${interaction.user.tag}` }),
                ],
              });
              setTimeout(() => feedback.delete().catch(() => {}), 5000);
            } catch (err) {
              if (err && err.code === 50013) {
                console.log(`[PERMS] No Perms Provided on ${player.guildId}`);
              } else {
                console.error("Feedback send error:", err);
              }
            }
          }

          await nplaying.edit({ components: getPlayerButtons(player) }).catch(() => {});
        });

        collector.on("end", async () => {
          const disabledComponents = getPlayerButtons(player, true);
          await nplaying.edit({ components: disabledComponents }).catch(() => {});
        });
      }
    } catch (e) {
      console.error("TrackStart Error:", e);
    }
  };

  client.manager.on("trackStart", handleTrackStart);
  client.manager.on("playerStart", handleTrackStart);
};

// 🖼️ Updated Canvas - Matches your previous nowplaying style
async function createMusicCard(track, client, player) {
  const width = 1000;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Rounded edges
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(40, 0);
  ctx.lineTo(width - 40, 0);
  ctx.quadraticCurveTo(width, 0, width, 40);
  ctx.lineTo(width, height - 40);
  ctx.quadraticCurveTo(width, height, width - 40, height);
  ctx.lineTo(40, height);
  ctx.quadraticCurveTo(0, height, 0, height - 40);
  ctx.lineTo(0, 40);
  ctx.quadraticCurveTo(0, 0, 40, 0);
  ctx.closePath();
  ctx.clip();

  try {
    const thumbnailURL =
      track.info?.thumbnail || track.thumbnail || client.user.displayAvatarURL({ size: 512 });
    const thumbnail = await loadImage(thumbnailURL);

    const imgRatio = thumbnail.width / thumbnail.height;
    const canvasRatio = width / height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.filter = "blur(25px) brightness(0.45)";
    ctx.drawImage(thumbnail, offsetX, offsetY, drawWidth, drawHeight);
    ctx.filter = "none";

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, width, height);
  } catch {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
  }

  // Title and Header (Lunexa branding)
  ctx.fillStyle = "#FFF";
  ctx.font = "bold 30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Lunexa", width / 2, 60);

  ctx.fillStyle = "#FFF";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  let title = track.info?.title || track.title || "Unknown Track";
  if (ctx.measureText(title).width > 930) {
    while (ctx.measureText(title + "...").width > 930) {
      title = title.slice(0, -1);
    }
    title += "...";
  }
  ctx.fillText(title, width / 2, 175);

  // Progress Bar
  const barX = 120;
  const barY = 205;
  const barWidth = width - 240;
  const barHeight = 8;

  const duration = track.info?.length || track.duration || 0;
  const position = track.info?.position || track.position || 0;
  const progress = duration > 0 && position ? position / duration : 0.01;

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 6);
  ctx.fill();

  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * progress, barHeight, 6);
  ctx.fill();

  const knobX = barX + barWidth * progress;
  ctx.beginPath();
  ctx.arc(knobX, barY + barHeight / 2, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF";
  ctx.fill();

  // Time text
  ctx.font = "17px Arial";
  ctx.fillStyle = "#FFF";
  ctx.textAlign = "left";
  ctx.fillText(formatMs(position), barX, barY + 30);
  ctx.textAlign = "right";
  ctx.fillText(formatMs(duration), barX + barWidth, barY + 30);

  ctx.restore();
  return canvas.toBuffer("image/png");
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

function getPlayerButtons(player, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("loop")
        .setEmoji("<:loop:1382664510019735553>")
        .setStyle(player.loop === "track" ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("back")
        .setEmoji("<:Back:1382664275012620300>")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("pause")
        .setEmoji(player.paused ? "<:resume:1382664368994648126>" : "<:Pause:1382664369975853116>")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("skip")
        .setEmoji("<:forward:1382664277839577189>")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("shuffle")
        .setEmoji("<:shuffle:1384497021477589042>")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    ),
  ];
}
