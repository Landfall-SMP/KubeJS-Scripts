// config
const warningTime = 15;
const clearedMessage = "All dropped items have been cleared!";
const clearInterval = 15 * 60;
const warningMessage = `Warning: All dropped items will be cleared in ${warningTime} seconds!`;

ServerEvents.tick(event => {
    const server = event.server;
    
    if (!server.persistentData.itemClearLastTime) {
        server.persistentData.itemClearLastTime = server.tickCount;
        server.persistentData.warningPhase = false;
    }

    const elapsedTicks = server.tickCount - server.persistentData.itemClearLastTime;
    const intervalTicks = clearInterval * 20;

    // warn phase
    if (!server.persistentData.warningPhase && elapsedTicks >= (intervalTicks - (warningTime * 20))) {
        server.players.forEach(player => {
            player.tell({
                text: warningMessage,
                color: 'red'
            });
        });
        
        server.persistentData.warningPhase = true;
    }

    // Clear phase
    if (elapsedTicks >= intervalTicks) {
        Utils.server.runCommandSilent('/kill @e[type=minecraft:item]');

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