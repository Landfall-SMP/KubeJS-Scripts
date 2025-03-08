// server_scripts/superchat.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const StringArgumentType = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType');
    const IntegerArgumentType = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType');
    
    // Helper function to get player's superchat credits
    function getSuperchatCredits(player) {
        // Initialize if not exists
        if (!player.persistentData.contains('superchat_credits')) {
            player.persistentData.putInt('superchat_credits', 0);
        }
        return player.persistentData.getInt('superchat_credits');
    }
    
    // Helper function to set player's superchat credits
    function setSuperchatCredits(player, amount) {
        player.persistentData.putInt('superchat_credits', amount);
    }
    
    // Superchat command - send a message to all players
    event.register(
        Commands.literal('superchat')
            .requires(source => source.hasPermission(0))
            .then(
                Commands.argument('message', StringArgumentType.greedyString())
                    .executes(context => {
                        // Get player and message
                        const player = context.source.player;
                        const message = StringArgumentType.getString(context, 'message');
                        
                        // Check if player has superchat credits
                        const credits = getSuperchatCredits(player);
                        if (credits <= 0) {
                            player.tell(Text.of("You don't have any superchat credits!").red());
                            player.tell(Text.of("This is one way we try to mitigate hosting costs, please visit https://store.landfall.world to get some!").red());
                            return 0;
                        }
                        
                        // Deduct one credit
                        setSuperchatCredits(player, credits - 1);
                        
                        // Debug output to console
                        console.log(`Player ${player.username} sent superchat: ${message}`);
                        
                        // Play sound to all players
                        Utils.server.runCommandSilent('execute as @a at @s run playsound minecraft:block.note_block.pling player @s ~ ~ ~ 1 1');
                        
                        // Format and send message
                        Utils.server.runCommandSilent(`tellraw @a ["",{"text":"===== Superchat ====","color":"gold"},{"text":"\\n${message.replace(/"/g, '\\"')}","color":"white"},{"text":"\\n- ${player.username}","color":"yellow"},{"text":"\\n===================","color":"gold"}]`);
                        
                        // Tell player how many credits remain
                        player.tell(Text.of(`You have ${credits - 1} superchat credits remaining.`).yellow());
                        
                        return 1;
                    })
            )
    );
    
    // Give Superchat command - give superchat credits to a player
    event.register(
        Commands.literal('givesuperchat')
            .requires(source => source.hasPermission(2)) // Requires op permission level 2
            .then(
                Commands.argument('player', StringArgumentType.word())
                    .then(
                        Commands.argument('amount', IntegerArgumentType.integer(1))
                            .executes(context => {
                                const playerName = StringArgumentType.getString(context, 'player');
                                const amount = IntegerArgumentType.getInteger(context, 'amount');
                                
                                // Handle special case for @a (all players)
                                if (playerName === '@a') {
                                    let count = 0;
                                    Utils.server.players.forEach(player => {
                                        const currentCredits = getSuperchatCredits(player);
                                        const newCredits = currentCredits + amount;
                                        setSuperchatCredits(player, newCredits);
                                        player.tell(Text.of(`You received ${amount} superchat credits. You now have ${newCredits} credits.`).green());
                                        count++;
                                    });
                                    
                                    context.source.sendSuccess(Text.of(`Gave ${amount} superchat credits to all ${count} online players.`).green(), true);
                                    return count;
                                }
                                
                                // Find the target player
                                const targetPlayer = Utils.server.getPlayer(playerName);
                                if (!targetPlayer) {
                                    context.source.sendFailure(Text.of(`Player ${playerName} not found!`).red());
                                    return 0;
                                }
                                
                                // Get current credits and add the specified amount
                                const currentCredits = getSuperchatCredits(targetPlayer);
                                const newCredits = currentCredits + amount;
                                setSuperchatCredits(targetPlayer, newCredits);
                                
                                // Inform the command sender and target player
                                context.source.sendSuccess(Text.of(`Gave ${amount} superchat credits to ${targetPlayer.username}. They now have ${newCredits} credits.`).green(), true);
                                targetPlayer.tell(Text.of(`You received ${amount} superchat credits. You now have ${newCredits} credits.`).green());
                                
                                return amount;
                            })
                    )
            )
    );
    
    // Add a command to check your superchat credits
    event.register(
        Commands.literal('superchatcredits')
            .requires(source => source.hasPermission(0))
            .executes(context => {
                const player = context.source.player;
                const credits = getSuperchatCredits(player);
                player.tell(Text.of(`You have ${credits} superchat credits.`).yellow());
                return credits;
            })
    );
});
