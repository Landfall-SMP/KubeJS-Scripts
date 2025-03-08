// File: kubejs/server_scripts/karma_donor_system.js

// Donor level multipliers - easily configurable
const donorMultipliers = {
    "supporter": 1,    // +1 bonus
    "sponsor": 2,      // +2 bonus
    "champion": 3      // +3 bonus
    // Add more donor levels as needed
};

// Karma system constants
const karmaIncrementInterval = 1200; // Karma increment interval in ticks (60 seconds)
const notificationInterval = 6000; // Notification interval in ticks (5 minutes)
const karmaBonus = 3; // Karma Bonus for BlueMap visibility
const groupActivityRadius = 50; // Radius to check for nearby players

// Declare variables that will be used throughout the script
let apiInstance, playerUUID, blueMapWebApp, isVisible, currentKarma, newKarma, player, visibilityText, groupBonusText, donorText;

// Function to check if a player is visible on BlueMap
function getBlueMapVisibility(player) {
    try {
        apiInstance = BlueMapAPI.getInstance();
        if (!apiInstance.isPresent()) {
            return { status: false, error: "BlueMapAPI is not initialized." };
        }

        let visibility = false;
        apiInstance.ifPresent(api => {
            blueMapWebApp = api.getWebApp();
            if (!blueMapWebApp) {
                visibility = false;
                throw new Error("WebApp is not accessible.");
            }

            playerUUID = player.uuid.toString();
            visibility = blueMapWebApp.getPlayerVisibility(playerUUID);
        });

        return { status: visibility, error: null };
    } catch (error) {
        return { status: false, error: error.message || error };
    }
}

// Function to calculate the group Bonus based on nearby players
function calculateGroupBonus(server, player, radius) {
    const playerPosition = player.blockPosition();
    let nearbyPlayers = 0;

    server.players.forEach(otherPlayer => {
        if (otherPlayer.uuid.toString() !== player.uuid.toString()) {
            const otherPosition = otherPlayer.blockPosition();
            const distance = Math.sqrt(
                Math.pow(playerPosition.x - otherPosition.x, 2) +
                Math.pow(playerPosition.y - otherPosition.y, 2) +
                Math.pow(playerPosition.z - otherPosition.z, 2)
            );

            if (distance <= radius) {
                nearbyPlayers++;
            }
        }
    });

    return nearbyPlayers;
}

// Event listener for server ticks
ServerEvents.tick(event => {
    const server = event.server;

    // Increment karma every specified interval
    if (event.server.tickCount % karmaIncrementInterval === 0) {
        server.players.forEach(player => {
            playerUUID = player.uuid.toString();

            // Check BlueMap visibility
            const visibilityCheck = getBlueMapVisibility(player);
            if (visibilityCheck.error) {
                return;
            }

            isVisible = visibilityCheck.status;

            // Calculate group Bonus
            const nearbyPlayers = calculateGroupBonus(server, player, groupActivityRadius);
            const groupBonus = nearbyPlayers; 

            // Get donor bonus if applicable
            const donorLevel = player.persistentData.donorLevel || "";
            const donorBonus = donorMultipliers[donorLevel.toLowerCase()] || 0;

            // Apply total Bonus (stacking by sum, not product)
            const visibilityBonus = isVisible ? karmaBonus : 0;
            const totalBonus = 1 + visibilityBonus + groupBonus + donorBonus;

            // Increment karma
            currentKarma = player.persistentData.karmaPoints || 0;
            newKarma = currentKarma + Math.floor(totalBonus);
            player.persistentData.karmaPoints = newKarma;
        });
    }

    // Notify players if their BlueMap visibility is off every specified interval
    if (event.server.tickCount % notificationInterval === 0) {
        server.players.forEach(player => {
            const visibilityCheck = getBlueMapVisibility(player);
            if (!visibilityCheck.error && !visibilityCheck.status) {
                player.tell(
                    "§eHey, your §6Map Visibility§e is off! You're missing out on the §aKarma Bonus§e. Turn it on to better engage with the citizens of Caldora."
                );
            }
        });
    }
});

// Register karma-related commands
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');
    const IntegerArgumentType = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType');
    const StringArgumentType = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType');

    // Karma command registration
    event.register(Commands.literal('karma')
        .executes(ctx => {
            const server = Utils.server;
            player = ctx.source.player;

            if (!player) {
                ctx.source.sendFailure("§cThis command can only be executed by a player.");
                return 0;
            }

            playerUUID = player.uuid.toString();
            currentKarma = player.persistentData.karmaPoints || 0;
            const visibilityCheck = getBlueMapVisibility(player);

            if (visibilityCheck.error) {
                player.tell(`§cERR: ${visibilityCheck.error}`);
            } else {
                isVisible = visibilityCheck.status;
                visibilityText = isVisible ? `§aActive (+${karmaBonus})` : "§cInactive";
            }

            const nearbyPlayers = calculateGroupBonus(server, player, groupActivityRadius);
            groupBonusText = nearbyPlayers > 0 ? `§aActive (+${nearbyPlayers})` : "§cInactive";

            // Get donor bonus if applicable
            const donorLevel = player.persistentData.donorLevel || "";
            const donorBonus = donorMultipliers[donorLevel.toLowerCase()] || 0;
            donorText = donorBonus > 0 ? `§a${donorLevel} (+${donorBonus})` : "§cNone";

            player.tell(`§eYour current Karma: §a${currentKarma}`);
            player.tell(`§eMap Visibility: ${visibilityText}`);
            player.tell(`§eGroup Activity: ${groupBonusText}`);
            player.tell(`§eDonor Status: ${donorText}`);
            return 1;
        })
        .then(Commands.literal('info')
            .executes(ctx => {
                const player = ctx.source.player;
                if (!player) {
                    ctx.source.sendFailure("§cThis command can only be executed by a player.");
                    return 0;
                }

                player.tell("§e--- §6Karma System Info §e---");
                player.tell("§6How to Earn Karma:");
                player.tell("§7- §a+1 karma §7every 60 seconds you are active (not AFK).");
                player.tell(`§7- §aMap Visibility Bonus: §e+${karmaBonus} §7when visible on the web map.`);
                player.tell(`§7- §aGroup Activity Bonus: §e+n1 §7, with n being other players within §a${groupActivityRadius} blocks.`);
                player.tell(`§7- §aDonor Bonus: §7Additional karma to reward your contributions to server hosting costs.`);
                player.tell(" ");
                player.tell("§6How to Use Karma:");
                player.tell(`§7- The §a/fasttravel §7command allows you to fast travel around.`);
                player.tell(`§7- The §a/exchange §7command allows you to exchange karma for cogs.`);
                player.tell(`§7- The §a/changereligion §7command allows you to convert to another faith.`);
		player.tell(`§7- The §a/devotion §7command takes 10,000 karma and unlocks your extra ability.`);
                player.tell(`§7- §eMore features coming soon! Stay tuned.`);
                return 1;
            })
        )
        .then(Commands.literal('get')
            .requires(source => source.hasPermission(2)) // Restrict to OPs
            .then(Commands.argument('target', EntityArgument.player())
                .executes(ctx => {
                    const target = EntityArgument.getPlayer(ctx, 'target');
                    if (!target) {
                        ctx.source.sendFailure("§cTarget player not found.");
                        return 0;
                    }

                    playerUUID = target.uuid.toString();
                    currentKarma = target.persistentData.karmaPoints || 0;

                    ctx.source.sendSuccess(`§e${target.name.string}'s Karma: §a${currentKarma}`, true);
                    return 1;
                })
            )
        )
        .then(Commands.literal('set')
            .requires(source => source.hasPermission(2)) // Restrict to OPs
            .then(Commands.argument('target', EntityArgument.player())
                .then(Commands.argument('amount', IntegerArgumentType.integer(0))
                    .executes(ctx => {
                        const target = EntityArgument.getPlayer(ctx, 'target');
                        const amount = IntegerArgumentType.getInteger(ctx, 'amount');

                        if (!target) {
                            ctx.source.sendFailure("§cTarget player not found.");
                            return 0;
                        }

                        target.persistentData.karmaPoints = amount;

                        target.tell(`§eYour Karma has been set to: §a${amount}`);
                        ctx.source.sendSuccess(`§eSet Karma for ${target.name.string} to §a${amount}`, true);
                        return 1;
                    })
                )
            )
        )
        .then(Commands.literal('add')
            .requires(source => source.hasPermission(2)) // Restrict to OPs
            .then(Commands.argument('target', EntityArgument.player())
                .then(Commands.argument('amount', IntegerArgumentType.integer(0))
                    .executes(ctx => {
                        const target = EntityArgument.getPlayer(ctx, 'target');
                        const amount = IntegerArgumentType.getInteger(ctx, 'amount');

                        if (!target) {
                            ctx.source.sendFailure("§cTarget player not found.");
                            return 0;
                        }

                        currentKarma = target.persistentData.karmaPoints || 0;
                        newKarma = currentKarma + amount;
                        target.persistentData.karmaPoints = newKarma;

                        target.tell(`§eYour Karma has been increased by: §a${amount}`);
                        ctx.source.sendSuccess(`§eAdded §a${amount} §eKarma to ${target.name.string}`, true);
                        return 1;
                    })
                )
            )
        )
    );
    
    // Donor commands registration
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
                    
                    // Get bonus amount for this level
                    const donorBonus = donorMultipliers[level.toLowerCase()] || 0;
                    
                    // Send success message to command executor
                    ctx.source.sendSuccess(`Set donor level for ${player.name.string} to "${level}" (Karma bonus: +${donorBonus})`, true);
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
                    const donorLevel = player.persistentData.donorLevel;
                    const donorBonus = donorMultipliers[donorLevel.toLowerCase()] || 0;
                    ctx.source.sendSuccess(`${player.name.string}'s donor level: ${donorLevel} (Karma bonus: +${donorBonus})`, true);
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
                const donorLevel = player.persistentData.donorLevel;
                const donorBonus = donorMultipliers[donorLevel.toLowerCase()] || 0;
                ctx.source.sendSuccess(`Your donor level: ${donorLevel} (Karma bonus: +${donorBonus})`, true);
            }
            return 1;
        })
    );
});
