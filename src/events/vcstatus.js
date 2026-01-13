const fetch = require("node-fetch");
const { token } = require("../config/config.js");

async function updateVoiceStatus(player, statusText) {
    if (!player || !player.voiceId) return;

    const status = statusText || "♪ Lunexa Music";

    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${player.voiceId}/voice-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to update voice status:', response.status, errorText);
        }
    } catch (err) {
        console.error("Fetch error while updating voice status:", err);
    }
}

module.exports = (client) => {
    const updateFromCurrent = async (player, prefix) => {
        const current = player.queue.current;
        if (current) {
            await updateVoiceStatus(player, `♪ Playing: ${current.title}`);
        } else {
            await updateVoiceStatus(player, null);
        }
    };

    client.manager.on("playerStart", async (player, track) => {
        await updateVoiceStatus(player, `Playing: ${track.title}`);
    });

    client.manager.on("playerPause", async (player) => {
        await updateFromCurrent(player, "Paused");
    });

    client.manager.on("playerResume", async (player) => {
        await updateFromCurrent(player, "Resumed");
    });

    client.manager.on("playerEnd", async (player, track, payload) => {
        // Delay slightly to avoid being overwritten by Lavalink
        setTimeout(() => updateVoiceStatus(player, null), 500);
    });

    client.manager.on("playerStop", async (player) => {
        await updateVoiceStatus(player, null);
    });

    client.manager.on("playerDestroy", async (player) => {
        await updateVoiceStatus(player, null);
    });
};