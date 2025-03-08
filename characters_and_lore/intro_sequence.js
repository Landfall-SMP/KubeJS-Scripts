// Register the /intro command
ServerEvents.commandRegistry(event => {
    const Commands = event.commands;
    const EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');
  
    event.register(
      Commands.literal('intro')
        .then(
          Commands.argument('target', EntityArgument.player())
            .executes(context => {
              const player = EntityArgument.getPlayer(context, 'target');
              console.log(`[Intro Command] Executing intro sequence for player: ${player.username}`);
              startIntroSequence(player);
              return 1;
            })
        )
    );
  });
  
  // Intro sequence function
  function startIntroSequence(player) {
    const server = player.server;
  
    console.log(`[Intro Sequence] Starting intro sequence for player: ${player.username}`);
  
    // Teleport player to intro location
    Utils.server.runCommandSilent(`gamemode adventure ${player.username}`);
// Utils.server.runCommandSilent(`/execute in landfall:limbo as ${player.username} facing 0 0 900 run tp -25.59 3.00 125.54`);
    Utils.server.runCommandSilent(`/execute in landfall:limbo as ${player.username} facing 10000 0 90 run tp 7 -35 35`);
    console.log(`[Intro Sequence] Teleported ${player.username} to intro.`);
  
    // Apply effects to the player
    Utils.server.runCommandSilent(`effect give ${player.username} minecraft:invisibility 600 1`);
    console.log(`[Intro Sequence] Applied blindness effect to ${player.username}`);
  
    Utils.server.runCommandSilent(`effect give ${player.username} minecraft:regeneration 600 16`);
    console.log(`[Intro Sequence] Applied slowness effect to ${player.username}`);
  
    // Play Sound 1 and send Message 1
    playSoundAndMessage(player, 'l530:sound1',
      '§6The Divine Entity: §7Ah, so you awaken… Lost, are we? No surprise. The Noble Blood courses through you, yet its weight obscures your past. Welcome to Caldora, land of old glory and fragile rebirth.');
  
    server.scheduleInTicks(19 * 20, () => {
      playSoundAndMessage(player, 'l530:sound2',
        '§6The Divine Entity: §7It\'s been fifteen hundred years since the fall of The Great Dominion... The gods may walk among us, but even their blessings come with a cost. You are not alone, nor are you safe.');
  
      server.scheduleInTicks(16 * 20, () => {
        playSoundAndMessage(player, 'l530:sound3',
          '§6The Divine Entity: §7Noble or not, your choices will bind or shatter these lands. Trust carefully, for even the most enduring oaths are forged in fire and broken in shadow.');
  
        server.scheduleInTicks(14 * 20, () => {
          playSoundAndMessage(player, 'l530:sound4',
            '§6The Divine Entity: §7Now… what are you called? (Use /name "<your name>" in chat)');
  
          // Mark the player as awaiting name input using persistentData
          player.persistentData.awaitingNameInput = true;
          console.log(`[Intro Sequence] Player ${player.username} is now awaiting name input via /name command.`);
  
          // Optional: Reminder
          server.scheduleInTicks(60 * 20, () => {
            if (player.persistentData.awaitingNameInput) {
              player.tell('§cReminder: Please set your name using /name <your name> to proceed.');
              console.log(`[Intro Sequence] Reminder sent to player: ${player.username}`);
            }
          });
        });
      });
    });
  }
  
  // Helper function to play sound and send message
  function playSoundAndMessage(player, sound, message) {
    Utils.server.runCommandSilent(`execute as ${player.username} at @s run playsound ${sound} master @s`);
    console.log(`[Sound Playback] Played sound "${sound}" for player: ${player.username}`);
    player.tell(message);
    console.log(`[Message Sent] Message sent to player: ${player.username}`);
  }
  
