// nickban.js
// Handles nickname ban toggle

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');

    // Command to toggle nickname ban status
    event.register(Commands.literal('nickban')
        .requires(source => source.hasPermission(2)) // Requires OP permission (level 2)
        .then(Commands.argument('player', EntityArgument.player())
            .executes(ctx => {
                const player = EntityArgument.getPlayer(ctx, 'player');
                
                // Get current ban status or default to false
                const currentStatus = player.persistentData.nickban || false;
                
                // Toggle the status
                player.persistentData.nickban = !currentStatus;
                
                // Send success message to command executor
                const newStatus = player.persistentData.nickban ? "banned" : "allowed";
                ctx.source.sendSuccess(`${player.name.string} is now ${newStatus} from using nicknames`, true);
                return 1;
            })
        )
    );
    
    // Command to check nickname ban status
    event.register(Commands.literal('nickbanstatus')
        .requires(source => source.hasPermission(2)) // Requires OP permission (level 2)
        .then(Commands.argument('player', EntityArgument.player())
            .executes(ctx => {
                const player = EntityArgument.getPlayer(ctx, 'player');
                
                // Get current ban status or default to false
                const status = player.persistentData.nickban || false;
                
                // Send status message
                const statusText = status ? "banned" : "allowed";
                ctx.source.sendSuccess(`${player.name.string} is currently ${statusText} from using nicknames`, true);
                return 1;
            })
        )
    );
});
