global.rtpCooldowns = global.rtpCooldowns || {};

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    // Declare all variables at the top
    const minCoord = -2500;
    const maxCoord = 2500;
    const teleportHeight = 250;
    const effectDuration = 600; // 30 seconds in ticks
    const effectAmplifier = 0;
    const cooldownTime = 120000; // 2 minutes in milliseconds
    let randomX, randomZ, currentTime, lastUsedTime, timeRemaining, minutesRemaining, secondsRemaining;

    event.register(Commands.literal('rtp')
        .executes(ctx => {
            const player = ctx.source.player;

            if (!player) {
                ctx.source.sendFailure("§cThis command can only be executed by a player.");
                return 0;
            }

            try {
                // Check if player is in the overworld
                if (player.level.dimension !== "minecraft:overworld") {
                    player.tell("§cRTP command can only be used in the overworld!");
                    return 0;
                }

                // Check cooldown
                currentTime = Date.now();
                lastUsedTime = global.rtpCooldowns[player.uuid.toString()] || 0;
                timeRemaining = lastUsedTime + cooldownTime - currentTime;

                if (timeRemaining > 0) {
                    minutesRemaining = Math.floor(timeRemaining / 60000);
                    secondsRemaining = Math.ceil((timeRemaining % 60000) / 1000);

                    if (secondsRemaining === 60) {
                        minutesRemaining += 1;
                        secondsRemaining = 0;
                    }
                    player.tell(`§cYou must wait ${minutesRemaining}m ${secondsRemaining}s before using RTP again.`);
                    return 0;
                }

                // Generate random coordinates
                randomX = Math.floor(Math.random() * (maxCoord - minCoord + 1)) + minCoord;
                randomZ = Math.floor(Math.random() * (maxCoord - minCoord + 1)) + minCoord;

                // Perform the teleport
                player.teleportTo(
                    "minecraft:overworld", // Explicitly specify overworld dimension
                    randomX,
                    teleportHeight,
                    randomZ,
                    0,
                    0
                );

                // Apply slow falling effect
                player.potionEffects.add("minecraft:slow_falling", effectDuration, effectAmplifier, false, false);

                // Update cooldown
                global.rtpCooldowns[player.uuid.toString()] = Date.now();

                // Notify the player
                player.tell(`§aYou have been teleported to §e${randomX}, ${teleportHeight}, ${randomZ}§a!`);
                player.tell("§7RTP will be available again in 2 minutes.");

                return 1;
            } catch (error) {
                player.tell("§cError during random teleport: " + error);
                console.error(error);
                return 0;
            }
        })
    );
});
