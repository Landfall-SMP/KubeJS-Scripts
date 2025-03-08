// cmd to send someone to the intro

ServerEvents.tick(event => {
  // Check every 60 ticks (3 seconds)
  if (event.server.tickCount % 60 === 0) {
    event.server.players.forEach(player => {
      const playerData = player.persistentData;

      if (!playerData?.hasPlayedBeforeV1) {
        // Teleport to specific location
        Utils.server.runCommandSilent(`intro ${player.username}`);

        // Mark as played before
        playerData.hasPlayedBeforeV1 = true;
      }
    });
  }
});
