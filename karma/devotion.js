// server_scripts/devotion_command.js

ServerEvents.commandRegistry(event => {
  const { commands } = event;
  
  event.register(
    commands.literal('devotion')
      .requires(source => source.hasPermission(0)) // Everyone can use it
      .executes(context => {
        const player = context.source.player;
        
        // Check if player has a persistent data entry for karma
        if (!player.persistentData.contains('karmaPoints')) {
          player.persistentData.karmaPoints = 0;
        }
        
        const currentKarma = player.persistentData.karmaPoints;
        
        // Check if player has enough karma
        if (currentKarma >= 10000) {
          // Subtract 10000 karma
          player.persistentData.karmaPoints = currentKarma - 10000;
          
          // Run scoreboard command
          Utils.server.runCommandSilent(`scoreboard players set ${player.username} devotion 1`);
          
          // Send success message
          player.tell("§aYou have spent §e10,000 §akarma points to receive §6Devotion§a!");
          
          return 1;
        } else {
          // Send error message
          player.tell("§cYou need §e10,000 §ckarma points to use this command. You currently have §e" + currentKarma + "§c.");
          
          return 0;
        }
      })
  );
});
