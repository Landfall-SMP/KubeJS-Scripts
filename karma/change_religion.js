// cfg constants
const RELIGION_KARMA_COST = 6000;
const RELIGION_CHANGE_LOCATION = {
    dimension: 'ae2:spatial_storage',
    x: 241,
    y: 67,
    z: -280
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
    server.runCommandSilent(`execute as ${player.name.string} in ae2:spatial_storage run tp ${player.name.string} 241 67 -280`);

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