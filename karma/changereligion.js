// Configuration constants
const RELIGION_KARMA_COST = 5000; // Karma cost to change religion
const RELIGION_CHANGE_LOCATION = {
    dimension: 'landfall:limbo',
    x: 28,
    y: -35,
    z: 35
};

// Function to handle religion change
function handleReligionChange(player) {
    // Check karma balance
    const currentKarma = player.persistentData.karmaPoints || 0;
    
    // Insufficient karma check
    if (currentKarma < RELIGION_KARMA_COST) {
        player.tell(`§cYou need §e${RELIGION_KARMA_COST} karma§c to change your religion, but you only have §e${currentKarma} karma§c.`);
        return false;
    }

    // Deduct karma
    player.persistentData.karmaPoints -= RELIGION_KARMA_COST;

    // Teleport the player using server command
    const server = Utils.server;
    server.runCommandSilent(`gamemode adventure ${player.name.string}`);
    server.runCommandSilent(`scoreboard players set ${player.name.string} devotion 0`);
    server.runCommandSilent(`execute as ${player.name.string} in landfall:limbo run tp ${player.name.string} 28 -33 35`);

    player.tell(`§aYou have changed your religion at the cost of §e${RELIGION_KARMA_COST} karma§a.`);
    return true;
}

// Register the command
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    
    event.register(Commands.literal('changereligion')
        .executes(ctx => {
            const player = ctx.source.player;
            if (!player) {
                ctx.source.sendFailure("§cThis command can only be executed by a player.");
                return 0;
            }
            
            return handleReligionChange(player) ? 1 : 0;
        })
    );
});
