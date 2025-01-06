// On first join, run this.

ServerEvents.tick(event => {
    if (event.server.tickCount % 60 === 0) {
      event.server.players.forEach(player => {
        const playerData = player.persistentData;
  
        if (!playerData?.hasPlayedBefore) {
          Utils.server.runCommandSilent(`execute in ae2:spatial_storage run tp ${player.username} 195 72 -226 90 0`);
          Utils.server.runCommandSilent(`gamemode adventure ${player.username}`);
          Utils.server.runCommandSilent(`effect give ${player.username} minecraft:regeneration 1000000 10 true`);
          Utils.server.runCommandSilent(`effect give ${player.username} minecraft:invisibility 1000000 1 true`);
          playerData.hasPlayedBefore = true;
        }
      });
    }
  });
  