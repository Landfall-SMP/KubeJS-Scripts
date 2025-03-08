// Global scope for persistence

// config
const KARMA_DEATH_PENALTY_PERCENTAGE = 0.05;
const MINIMUM_KARMA_PENALTY = 1;

// Declare all variables at the top
let player, playerUUID, currentKarma, penaltyAmount, remainingKarma;

// Player respawn event
PlayerEvents.respawned(event => {
    try {
        player = event.player;
        playerUUID = player.uuid.toString();

        currentKarma = player.persistentData.karmaPoints || 0;

        penaltyAmount = Math.max(Math.floor(currentKarma * KARMA_DEATH_PENALTY_PERCENTAGE), MINIMUM_KARMA_PENALTY);
        remainingKarma = Math.max(0, currentKarma - penaltyAmount);

        // Apply penalty
        player.persistentData.karmaPoints = remainingKarma;

        player.tell(`§cYou lost §e${penaltyAmount} karma§c due to your death.`);
        player.tell(`§aYour remaining karma: §e${remainingKarma}`);

    } catch (error) {
        console.error(`Error applying karmic death penalty: ${error}`);
    }
});
