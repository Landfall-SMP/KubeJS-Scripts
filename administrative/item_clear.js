// item_clear.js
// Keeps items from causing server lag. Clears them periodically.

// Configuration
const warningTime = 15; // 15 seconds before clearing
const clearedMessage = "All dropped items have been cleared!";
const clearInterval = 15 * 60; // 15 minutes in seconds
const warningMessage = `Warning: All dropped items will be cleared in ${warningTime} seconds!`;

ServerEvents.tick(event => {
    const server = event.server;
    
    // Initialize persistent data if not exists
    if (!server.persistentData.itemClearLastTime) {
        server.persistentData.itemClearLastTime = server.tickCount;
        server.persistentData.warningPhase = false;
    }

    // Calculate elapsed time in ticks
    const elapsedTicks = server.tickCount - server.persistentData.itemClearLastTime;
    const intervalTicks = clearInterval * 20; // Convert seconds to ticks

    // Warning phase
    if (!server.persistentData.warningPhase && elapsedTicks >= (intervalTicks - (warningTime * 20))) {
        // Send warning to all players
        server.players.forEach(player => {
            player.tell({
                text: warningMessage,
                color: 'red'
            });
        });
        
        // Mark that warning has been sent
        server.persistentData.warningPhase = true;
    }

    // Clear phase
    if (elapsedTicks >= intervalTicks) {
        // Clear all dropped items
        Utils.server.runCommandSilent('/kill @e[type=minecraft:item]');

        // Notify all players
        server.players.forEach(player => {
            player.tell({
                text: clearedMessage,
                color: 'red'
            });
        });

        // Reset the timer and warning phase
        server.persistentData.itemClearLastTime = server.tickCount;
        server.persistentData.warningPhase = false;
    }
});
