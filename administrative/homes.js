// File: kubejs/server_scripts/home_system.js

// Define homes allowed by donor level - easily configurable
const homesByDonorLevel = {
    'default': 1,       // Regular players get 1 home
    'supporter': 2,     // Supporters get 2 homes
    'sponsor': 2,       // Sponsors get 3 homes
    'champion': 3       // Champions get 5 homes
    // Add more donor levels as needed
};

// Define cooldowns in seconds by donor level - easily configurable
const cooldownsByDonorLevel = {
    'default': 300,
    'supporter': 300,
    'sponsor': 150,
    'champion': 150
    // Add more donor levels as needed
};

// Function to get maximum allowed homes for a player
function getMaxHomes(player) {
    const donorLevel = player.persistentData.donorLevel || 'default';
    return homesByDonorLevel[donorLevel.toLowerCase()] || homesByDonorLevel.default;
}

// Function to get cooldown time for a player
function getCooldownTime(player) {
    const donorLevel = player.persistentData.donorLevel || 'default';
    return cooldownsByDonorLevel[donorLevel.toLowerCase()] || cooldownsByDonorLevel.default;
}

// Function to check if the player is on cooldown
function isOnCooldown(player) {
    if (!player.persistentData.lastHomeTeleport) {
        return false;
    }
    
    const now = Date.now();
    const lastTeleport = player.persistentData.lastHomeTeleport;
    const cooldownTime = getCooldownTime(player) * 1000; // Convert to milliseconds
    
    return (now - lastTeleport) < cooldownTime;
}

// Function to get remaining cooldown time in seconds
function getRemainingCooldown(player) {
    if (!player.persistentData.lastHomeTeleport) {
        return 0;
    }
    
    const now = Date.now();
    const lastTeleport = player.persistentData.lastHomeTeleport;
    const cooldownTime = getCooldownTime(player) * 1000; // Convert to milliseconds
    const elapsed = now - lastTeleport;
    
    if (elapsed >= cooldownTime) {
        return 0;
    }
    
    return Math.ceil((cooldownTime - elapsed) / 1000);
}

// Function to set cooldown
function setHomeTeleportCooldown(player) {
    player.persistentData.lastHomeTeleport = Date.now();
}

// Function to initialize player homes in persistentData
function initializePlayerHomes(player) {
    if (!player.persistentData.homes) {
        player.persistentData.homes = {};
    }
}

// Function to get a player's homes
function getPlayerHomes(player) {
    initializePlayerHomes(player);
    return player.persistentData.homes;
}

// Function to validate a home name
function isValidHomeName(name) {
    return /^[a-zA-Z0-9_\-]{1,16}$/.test(name);
}

// Function to determine which homes are accessible based on donor level
function getAccessibleHomes(player) {
    const homes = getPlayerHomes(player);
    const maxHomes = getMaxHomes(player);
    const homeNames = Object.keys(homes);
    
    // If player has fewer or equal homes than allowed, all are accessible
    if (homeNames.length <= maxHomes) {
        return homes;
    }
    
    // If player has more homes than allowed, prioritize certain homes
    const accessibleHomes = {};
    
    // Priority 1: Default home
    if (homes['default']) {
        accessibleHomes['default'] = homes['default'];
        
        // If max homes is 1 and we have the default, we're done
        if (maxHomes === 1) {
            return accessibleHomes;
        }
    }
    
    // Get remaining names (excluding default if it exists and was kept)
    const remainingNames = homeNames.filter(name => 
        name !== 'default' || !accessibleHomes['default']);
    
    // Sort alphabetically
    remainingNames.sort();
    
    // Add homes alphabetically until we reach the limit
    const remainingSlots = maxHomes - Object.keys(accessibleHomes).length;
    remainingNames.slice(0, remainingSlots).forEach(name => {
        accessibleHomes[name] = homes[name];
    });
    
    return accessibleHomes;
}

// Check if a specific home is accessible
function isHomeAccessible(player, homeName) {
    const accessibleHomes = getAccessibleHomes(player);
    return accessibleHomes.hasOwnProperty(homeName);
}

ServerEvents.commandRegistry(event => {
    var Commands = event.commands;
    var StringArgumentType = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType');
    
    // /home [name] - Teleport to home
    event.register(
        Commands.literal('home')
            .executes(function(ctx) {
                var player = ctx.source.player;
                if (!player) {
                    ctx.source.sendFailure("§cThis command can only be executed by a player.");
                    return 0;
                }

                var homes = getPlayerHomes(player);
                
                // Check if player has any homes
                if (Object.keys(homes).length === 0) {
                    player.tell("§cYou don't have any homes set. Use §6/sethome <name>§c to create one.");
                    return 0;
                }

                // Check if player is on cooldown
                if (isOnCooldown(player)) {
                    var remaining = getRemainingCooldown(player);
                    player.tell("§cYou must wait " + remaining + " second" + (remaining !== 1 ? "s" : "") + " before teleporting to a home again.");
                    return 0;
                }

                // Try to teleport to "default" home
                var defaultHome = homes["default"];
                
                if (!defaultHome) {
                    player.tell("§cYou don't have a default home. Use §6/sethome§c to create one.");
                    return 0;
                }

                // Check if the default home is accessible
                if (!isHomeAccessible(player, "default")) {
                    var maxHomes = getMaxHomes(player);
                    player.tell("§cYou no longer have access to your default home due to changes to your donation status.");
                    player.tell("§cYour current donor level only allows " + maxHomes + " home" + (maxHomes !== 1 ? 's' : '') + ".");
                    player.tell("§eUpgrade your donor status to access more homes.");
                    return 0;
                }

                try {
                    // FIXED: Use direct teleport command
                    var x = defaultHome.x;
                    var y = defaultHome.y;
                    var z = defaultHome.z;
                    var dim = defaultHome.dimension || "minecraft:overworld";
                    
                    // Use dimension teleport command
                    var command = "execute in " + dim + " as " + player.getName().getString() + " run tp @s " + 
                                   x + " " + y + " " + z;
                    
                    Utils.server.runCommandSilent(command);
                    player.tell("§aWelcome home!");
                    
                    // Set cooldown after successful teleport
                    setHomeTeleportCooldown(player);
                    
                    return 1;
                } catch (e) {
                    player.tell("§cError teleporting: " + e);
                    return 0;
                }
            })
            .then(Commands.argument('name', StringArgumentType.word())
                .executes(function(ctx) {
                    var player = ctx.source.player;
                    if (!player) {
                        ctx.source.sendFailure("§cThis command can only be executed by a player.");
                        return 0;
                    }

                    var homeName = StringArgumentType.getString(ctx, 'name');
                    var homes = getPlayerHomes(player);
                    
                    if (!homes[homeName]) {
                        player.tell("§cYou don't have a home named \"" + homeName + "\".");
                        return 0;
                    }
                    
                    // Check if player is on cooldown
                    if (isOnCooldown(player)) {
                        var remaining = getRemainingCooldown(player);
                        player.tell("§cYou must wait " + remaining + " second" + (remaining !== 1 ? "s" : "") + " before teleporting to a home again.");
                        return 0;
                    }
                    
                    // Check if the home is accessible
                    if (!isHomeAccessible(player, homeName)) {
                        var maxHomes = getMaxHomes(player);
                        player.tell("§cYou can't teleport to \"" + homeName + "\" as it exceeds your home limit.");
                        player.tell("§cYour current donor level only allows " + maxHomes + " home" + (maxHomes !== 1 ? 's' : '') + ".");
                        player.tell("§eUpgrade your donor status or delete other homes to access this home.");
                        return 0;
                    }
                    
                    var home = homes[homeName];
                    
                    try {
                        // FIXED: Use direct teleport command
                        var x = home.x;
                        var y = home.y;
                        var z = home.z;
                        var dim = home.dimension || "minecraft:overworld";
                        
                        // Use dimension teleport command
                        var command = "execute in " + dim + " as " + player.getName().getString() +" run tp @s " + 
                                       x + " " + y + " " + z;
                        
                        Utils.server.runCommandSilent(command);
                        player.tell("§aWelcome to your home \"" + homeName + "\"!");
                        
                        // Set cooldown after successful teleport
                        setHomeTeleportCooldown(player);
                        
                        return 1;
                    } catch (e) {
                        player.tell("§cError teleporting: " + e);
                        return 0;
                    }
                })
            )
    );
    
    // /homes - List all homes and show command help
    event.register(
        Commands.literal('homes')
            .executes(function(ctx) {
                var player = ctx.source.player;
                if (!player) {
                    ctx.source.sendFailure("§cThis command can only be executed by a player.");
                    return 0;
                }

                var homes = getPlayerHomes(player);
                var accessibleHomes = getAccessibleHomes(player);
                var homeCount = Object.keys(homes).length;
                var maxHomes = getMaxHomes(player);
                
                player.tell("§e--- §6Home System Commands §e---");
                player.tell("§6/home [name] §7- Teleport to a home (default if no name)");
                player.tell("§6/sethome [name] §7- Set a home at your current location");
                player.tell("§6/delhome [name] §7- Delete a specific home");
                player.tell("§6/homes §7- List all your homes and show this help");
                
                var donorLevel = player.persistentData.donorLevel || "regular player";
                player.tell("§eYou can set up to §6" + maxHomes + " homes§e as a " + donorLevel + ".");
                
                // Add cooldown information
                var cooldownTime = getCooldownTime(player);
                player.tell("§eCooldown between teleports: §6" + cooldownTime + " second" + (cooldownTime !== 1 ? 's' : ''));
                
                // Show remaining cooldown if on cooldown
                if (isOnCooldown(player)) {
                    var remaining = getRemainingCooldown(player);
                    player.tell("§eYou can teleport to a home in: §6" + remaining + " second" + (remaining !== 1 ? 's' : ''));
                }
                
                if (homeCount === 0) {
                    player.tell("§eYou don't have any homes set yet.");
                    return 1;
                }

                player.tell("§eYour homes (§6" + Object.keys(accessibleHomes).length + "/" + maxHomes + "§e):");
                
                // Get sorted home names
                var homeNames = Object.keys(homes);
                homeNames.sort();
                
                // Display homes with locked ones grayed out
                for (var i = 0; i < homeNames.length; i++) {
                    var homeName = homeNames[i];
                    var home = homes[homeName];
                    var dimensionName = (home.dimension || "minecraft:overworld").replace("minecraft:", "");
                    
                    // Check if home is accessible
                    var isLocked = !accessibleHomes.hasOwnProperty(homeName);
                    var prefix = isLocked ? "§8" : "§6"; // Gray for locked, gold for accessible
                    var lockStatus = isLocked ? " §c[LOCKED]" : "";
                    
                    player.tell(prefix + homeName + "§e: §a" + Math.floor(home.x) + "§e, §a" + 
                              Math.floor(home.y) + "§e, §a" + Math.floor(home.z) + "§e in §a" + 
                              dimensionName + lockStatus);
                }
                
                // Show explanation if player has locked homes
                var lockedCount = homeCount - Object.keys(accessibleHomes).length;
                if (lockedCount > 0) {
                    player.tell("§c" + lockedCount + " home" + (lockedCount !== 1 ? "s are" : " is") + 
                               " locked because your current donor level only allows " + maxHomes + " home" + 
                               (maxHomes !== 1 ? "s" : "") + ".");
                    player.tell("§eUpgrade your donor level to access locked homes, or delete some to set new ones.");
                }
                
                return 1;
            })
    );
    
    // /sethome [name] - Set a home
    event.register(
        Commands.literal('sethome')
            .executes(function(ctx) {
                // Set default home if no name given
                var player = ctx.source.player;
                if (!player) {
                    ctx.source.sendFailure("§cThis command can only be executed by a player.");
                    return 0;
                }

                return setHome(player, "default");
            })
            .then(Commands.argument('name', StringArgumentType.word())
                .executes(function(ctx) {
                    var player = ctx.source.player;
                    if (!player) {
                        ctx.source.sendFailure("§cThis command can only be executed by a player.");
                        return 0;
                    }

                    var homeName = StringArgumentType.getString(ctx, 'name');
                    return setHome(player, homeName);
                })
            )
    );
    
    // /delhome [name] - Delete a home
    event.register(
        Commands.literal('delhome')
            .executes(function(ctx) {
                // Delete default home if no name given
                var player = ctx.source.player;
                if (!player) {
                    ctx.source.sendFailure("§cThis command can only be executed by a player.");
                    return 0;
                }

                var homes = getPlayerHomes(player);
                
                if (!homes["default"]) {
                    player.tell("§cYou don't have a default home to delete.");
                    return 0;
                }
                
                delete homes["default"];
                player.tell("§aDeleted your default home.");
                return 1;
            })
            .then(Commands.argument('name', StringArgumentType.word())
                .executes(function(ctx) {
                    var player = ctx.source.player;
                    if (!player) {
                        ctx.source.sendFailure("§cThis command can only be executed by a player.");
                        return 0;
                    }

                    var homeName = StringArgumentType.getString(ctx, 'name');
                    var homes = getPlayerHomes(player);
                    
                    if (!homes[homeName]) {
                        player.tell("§cYou don't have a home named \"" + homeName + "\".");
                        return 0;
                    }
                    
                    delete homes[homeName];
                    player.tell("§aDeleted home \"" + homeName + "\".");
                    
                    // If they've deleted a home and have locked homes, remind them they might
                    // now be able to access previously locked homes
                    var accessibleHomes = getAccessibleHomes(player);
                    if (Object.keys(homes).length > Object.keys(accessibleHomes).length) {
                        player.tell("§eYou still have locked homes. Use §6/homes§e to see which ones are now accessible.");
                    }
                    
                    return 1;
                })
            )
    );
    
    // Helper function to set a home
    function setHome(player, homeName) {
        if (!isValidHomeName(homeName)) {
            player.tell("§cInvalid home name. Names must be 1-16 characters and contain only letters, numbers, underscores, and hyphens.");
            return 0;
        }
        
        var homes = getPlayerHomes(player);
        var currentCount = Object.keys(homes).length;
        var maxHomes = getMaxHomes(player);
        
        // Check if player is at the home limit and trying to create a new home
        if (currentCount >= maxHomes && !homes[homeName]) {
            player.tell("§cYou've reached your home limit (" + maxHomes + "). Delete an existing home before creating a new one.");
            
            // Tell them if they need to upgrade donor status
            if (maxHomes === homesByDonorLevel.default) {
                player.tell("§eBecoming a donor would allow you to set more homes.");
            }
            
            return 0;
        }
        
        // Get player position and rotation
        var x = player.x;
        var y = player.y;
        var z = player.z;
        
        // FIXED: Get the dimension ID correctly as a simple string
        var dimensionId = player.level.dimension;
        
        var yaw = player.yRot;
        var pitch = player.xRot;
        
        // Save the home
        homes[homeName] = {
            x: x,
            y: y,
            z: z,
            dimension: dimensionId,
            xRot: pitch,
            yRot: yaw
        };
        
        player.tell("§aHome \"" + homeName + "\" set at " + Math.floor(x) + ", " + 
                  Math.floor(y) + ", " + Math.floor(z) + ".");
        
        // Tell them how many homes they have left
        var accessibleCount = Object.keys(getAccessibleHomes(player)).length;
        var remaining = maxHomes - accessibleCount;
        if (remaining > 0) {
            player.tell("§eYou can set " + remaining + " more home" + (remaining !== 1 ? 's' : '') + ".");
        } else {
            player.tell("§eYou've used all your available home slots.");
        }
        
        return 1;
    }
});
