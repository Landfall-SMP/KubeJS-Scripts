// donorctl.js
// Handles donation states

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');
    const StringArgumentType = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType');

    // Command to set a donor level (overwriting any existing level)
    event.register(Commands.literal('donorset')
        .requires(source => source.hasPermission(2)) // Requires OP permission (level 2)
        .then(Commands.argument('player', EntityArgument.player())
            .then(Commands.argument('level', StringArgumentType.string())
                .executes(ctx => {
                    const player = EntityArgument.getPlayer(ctx, 'player');
                    const level = StringArgumentType.getString(ctx, 'level');
                    
                    // Store the donor level in player's persistent data
                    player.persistentData.donorLevel = level;
                    
                    // Send success message to command executor
                    ctx.source.sendSuccess(`Set donor level for ${player.name.string} to "${level}"`, true);
                    return 1;
                })
            )
        )
    );
    
    // Command to remove a donor level
    event.register(Commands.literal('donordel')
        .requires(source => source.hasPermission(2)) // Requires OP permission (level 2)
        .then(Commands.argument('player', EntityArgument.player())
            .executes(ctx => {
                const player = EntityArgument.getPlayer(ctx, 'player');
                
                // Check if player has a donor level
                if (!player.persistentData.donorLevel) {
                    ctx.source.sendFailure(`${player.name.string} does not have a donor level`);
                    return 0;
                }
                
                // Remove the donor level from persistent data
                delete player.persistentData.donorLevel;
                
                // Send success message to command executor
                ctx.source.sendSuccess(`Removed donor level from ${player.name.string}`, true);
                return 1;
            })
        )
    );
    
    // Command to get donor level for a player
    event.register(Commands.literal('donorget')
        .requires(source => source.hasPermission(2)) // Requires OP permission (level 2)
        .then(Commands.argument('player', EntityArgument.player())
            .executes(ctx => {
                const player = EntityArgument.getPlayer(ctx, 'player');
                
                // Check if player has a donor level
                if (!player.persistentData.donorLevel) {
                    ctx.source.sendSuccess(`${player.name.string} has no donor level`, true);
                } else {
                    ctx.source.sendSuccess(`${player.name.string}'s donor level: ${player.persistentData.donorLevel}`, true);
                }
                return 1;
            })
        )
        .executes(ctx => {
            // Allow players to check their own donor level
            if (!ctx.source.player) {
                ctx.source.sendFailure("This command can only be executed by a player when no target is specified");
                return 0;
            }
            
            const player = ctx.source.player;
            
            // Check if player has a donor level
            if (!player.persistentData.donorLevel) {
                ctx.source.sendSuccess("You have no donor level", true);
            } else {
                ctx.source.sendSuccess(`Your donor level: ${player.persistentData.donorLevel}`, true);
            }
            return 1;
        })
    );
});
