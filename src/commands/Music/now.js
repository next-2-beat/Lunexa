const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "nowplaying",
  aliases: ["np", "now"],
  description: "Show the current song and next 3 in queue",
  category: "Music",
  owner: false,
  inVc: true,
  sameVc: false,
  premium: false,
  dj: true,

  run: async (client, message, args, prefix) => {
    try {
      const player = client.manager.players.get(message.guild.id);
      if (!player) {
        return message.reply({
          content: "<:cross:1433807192003444848> There is no active player in this server.",
        });
      }

      const current = player.current;
      if (!current) {
        return message.reply({
          content: "🎵 No track is currently playing.",
        });
      }

      const buffer = await createMusicCard(current, client);
      const attachment = new AttachmentBuilder(buffer, { name: "nowplaying.png" });

      return message.channel.send({ files: [attachment] });
    } catch (error) {
      console.error("NowPlaying error:", error);
      return message.reply({
        content: "<:cross:1433807192003444848> An unexpected error occurred while showing the current track.",
      });
    }
  },
};

async function createMusicCard(track, client) {
  const width = 1000;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Rounded corners
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
    const thumbnailURL = track.info?.thumbnail || track.thumbnail || client.user.displayAvatarURL({ size: 512 });
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

  // If Lavalink sends position, show progress
  const duration = track.info?.length || track.duration || 0;
  const position = track.info?.position || track.position || 0;
  const progress = duration > 0 && position
    ? position / duration
    : 0.01;

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

  // Time Text
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
