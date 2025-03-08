// File: server_scripts/pdo_command.js

// Declare variables at the top of the file
let lore = [];

// PDO configuration - defined in script with specific items as keys
const PDO_CONFIG = {
    // Key: PDO item name
    // Value: { item: "minecraft:item_id", name: "custom colored name", tooltips: ["lore 1", "lore 2"], allowedPlayers: ["player1", "player2", "*"] }
    
    // Example entries:
    "Red Sand Bricks": {
        item: "minecraft:bricks",
        name: "§r§fRed Sand Bricks",
        tooltips: ["Bricks made by the Red Sand Co.,", "known for their special formulation and quality control.", "§r§cExport of Red Sand Co."],
        allowedPlayers: ["Colpr_The_Great"]
    },
    
        // Nouveaux Ides Wines Collection
        "NI Rouge Royales": {
            item: "vinery:red_wine",
            name: "§r§fRouge Royales",
            tooltips: ["A classic Idesian vintage", "A bold, velvety red with spruce and other spices", "§r§cExport of Nouveaux Ides"],
            allowedPlayers: ["AGardenPeg"]
        },
        
        "NI Lune de Cerise": {
            item: "vinery:cherry_wine",
            name: "§r§fLune de Cerise",
            tooltips: ["A rich cherry wine with smooth vanilla and oak notes", "Offering an elegant finish", "§r§cExport of Nouveaux Ides"],
            allowedPlayers: ["AGardenPeg"]
        },
        
        "NI Vigourex Imperial": {
            item: "vinery:jo_special_mixture",
            name: "§r§fVigourex Imperial",
            tooltips: ["An exclusive red with deep berry flavors", "A refined aged finish, crafted for the elite", "§r§cExport of Nouveaux Ides"],
            allowedPlayers: ["AGardenPeg"]
        },
        
        "NI Vigneron de Luxe": {
            item: "vinery:strad_wine",
            name: "§r§fVigneron de Luxe",
            tooltips: ["A luxurious wine with hints of rich cocoa and sugar", "Delivering excellency with every pour", "§r§cExport of Nouveaux Ides"],
            allowedPlayers: ["AGardenPeg"]
        },
        
        "NI Saphir Couronne": {
            item: "vinery:lilitu_wine",
            name: "§r§fSaphir Couronne",
            tooltips: ["A premium blend of honey and cherry", "Delivering a smooth, sweet finish", "§r§cExport of Nouveaux Ides"],
            allowedPlayers: ["AGardenPeg"]
        },
        
        "NI Grands Vin d'Or": {
            item: "vinery:jellie_wine",
            name: "§r§fGrands Vin d'Or",
            tooltips: ["The pinnacle of luxury and wealth", "With a taste of gold and aged for 200 years", "The most prestigious and deluxe vintage", "§r§cExport of Nouveaux Ides"],
            allowedPlayers: ["AGardenPeg"]
        }
};

// Check if a player is authorized to use a specific PDO item
function canUsePdoItem(player, pdoItemName) {
    // Check if the PDO item exists
    if (!PDO_CONFIG[pdoItemName]) {
        return false;
    }
    
    // Operators always have access
    if (player.op) return true;
    
    const username = player.username;
    const allowedPlayers = PDO_CONFIG[pdoItemName].allowedPlayers || [];
    
    // Check for specific player permission
    if (allowedPlayers.includes(username)) return true;
    
    // Check for wildcard
    if (allowedPlayers.includes("*")) return true;
    
    return false;
}

// Get array of PDO items a player can use
function getAuthorizedPdoItems(player) {
    const username = player.username;
    const isOp = player.op;
    
    return Object.keys(PDO_CONFIG).filter(pdoItemName => {
        const config = PDO_CONFIG[pdoItemName];
        
        // Operators can use all PDO items
        if (isOp) return true;
        
        const allowedPlayers = config.allowedPlayers || [];
        
        // Check player-specific permission or wildcard
        return allowedPlayers.includes(username) || allowedPlayers.includes("*");
    });
}

// Helper to add player permission for a PDO item
function addPlayerToPdoItem(pdoItemName, username) {
    if (!PDO_CONFIG[pdoItemName]) {
        return false; // PDO item doesn't exist
    }
    
    if (!PDO_CONFIG[pdoItemName].allowedPlayers) {
        PDO_CONFIG[pdoItemName].allowedPlayers = [];
    }
    
    if (PDO_CONFIG[pdoItemName].allowedPlayers.includes(username)) {
        return false; // Already has permission
    }
    
    PDO_CONFIG[pdoItemName].allowedPlayers.push(username);
    return true;
}

// Helper to remove player permission from a PDO item
function removePlayerFromPdoItem(pdoItemName, username) {
    if (!PDO_CONFIG[pdoItemName] || 
        !PDO_CONFIG[pdoItemName].allowedPlayers || 
        !PDO_CONFIG[pdoItemName].allowedPlayers.includes(username)) {
        return false; // Doesn't have permission
    }
    
    PDO_CONFIG[pdoItemName].allowedPlayers = PDO_CONFIG[pdoItemName].allowedPlayers.filter(
        player => player !== username
    );
    
    return true;
}

// Register commands
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const StringArgumentType = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType');
    
    // Main PDO command
    event.register(
        Commands.literal('pdo')
            .executes(context => {
                const player = context.source.player;
                player.tell("§eUsage: /pdo <itemName>");
                player.tell("§eAvailable PDO items:");
                const authorizedItems = getAuthorizedPdoItems(player);
                authorizedItems.forEach(item => {
                    player.tell(` §7- §b${item}`);
                });
                return 1;
            })
            .then(
                Commands.argument('itemName', StringArgumentType.greedyString())
                    .suggests((context, builder) => {
                        // Suggest all PDO items the player has access to
                        const player = context.source.player;
                        if (player) {
                            const authorizedItems = getAuthorizedPdoItems(player);
                            authorizedItems.forEach(itemName => {
                                builder.suggest(itemName);
                            });
                        }
                        return builder.buildFuture();
                    })
                    .executes(context => {
                        const player = context.source.player;
                        const pdoItemName = StringArgumentType.getString(context, 'itemName');
                        
                        console.log(`[PDO Command] Player ${player.username} is attempting to apply PDO item: "${pdoItemName}"`);
                        
                        // Check if the PDO item exists
                        if (!PDO_CONFIG[pdoItemName]) {
                            player.tell(`§cPDO item "${pdoItemName}" does not exist.`);
                            return 0;
                        }
                        
                        // Check permission
                        if (!canUsePdoItem(player, pdoItemName)) {
                            player.tell(`§cYou don't have permission to use PDO item "${pdoItemName}".`);
                            console.log(`[PDO Command] Denied - player ${player.username} is not authorized for PDO item "${pdoItemName}"`);
                            return 0;
                        }
                        
                        // Apply PDO item
                        applyPdoItem(player, pdoItemName);
                        return 1;
                    })
            )
    );
    
    // PDO Admin commands
    event.register(
        Commands.literal('pdoadmin')
            .requires(source => source.hasPermission(2)) // Requires permission level 2 (op)
            
            // Add player to PDO item
            .then(
                Commands.literal('add')
                    .then(
                        Commands.argument('pdoItemName', StringArgumentType.string())
                            .suggests((context, builder) => {
                                // Suggest available PDO items
                                Object.keys(PDO_CONFIG).forEach(itemName => {
                                    builder.suggest(itemName);
                                });
                                return builder.buildFuture();
                            })
                            .then(
                                Commands.argument('username', StringArgumentType.word())
                                    .executes(context => {
                                        const admin = context.source.player;
                                        const pdoItemName = StringArgumentType.getString(context, 'pdoItemName');
                                        const username = StringArgumentType.getString(context, 'username');
                                        
                                        if (!PDO_CONFIG[pdoItemName]) {
                                            admin.tell(`§cPDO item "${pdoItemName}" does not exist.`);
                                            return 0;
                                        }
                                        
                                        if (addPlayerToPdoItem(pdoItemName, username)) {
                                            admin.tell(`§aGranted §e${username}§a permission to use PDO item §b"${pdoItemName}"§a.`);
                                            console.log(`[PDO Admin] Added ${username} to PDO item "${pdoItemName}"`);
                                        } else {
                                            admin.tell(`§c${username} already has permission for PDO item "${pdoItemName}".`);
                                        }
                                        return 1;
                                    })
                            )
                    )
            )
            
            // Remove player from PDO item
            .then(
                Commands.literal('remove')
                    .then(
                        Commands.argument('pdoItemName', StringArgumentType.string())
                            .suggests((context, builder) => {
                                // Suggest available PDO items
                                Object.keys(PDO_CONFIG).forEach(itemName => {
                                    builder.suggest(itemName);
                                });
                                return builder.buildFuture();
                            })
                            .then(
                                Commands.argument('username', StringArgumentType.word())
                                    .executes(context => {
                                        const admin = context.source.player;
                                        const pdoItemName = StringArgumentType.getString(context, 'pdoItemName');
                                        const username = StringArgumentType.getString(context, 'username');
                                        
                                        if (!PDO_CONFIG[pdoItemName]) {
                                            admin.tell(`§cPDO item "${pdoItemName}" does not exist.`);
                                            return 0;
                                        }
                                        
                                        if (removePlayerFromPdoItem(pdoItemName, username)) {
                                            admin.tell(`§aRemoved §e${username}'s§a permission to use PDO item §b"${pdoItemName}"§a.`);
                                            console.log(`[PDO Admin] Removed ${username} from PDO item "${pdoItemName}"`);
                                        } else {
                                            admin.tell(`§c${username} doesn't have permission for PDO item "${pdoItemName}".`);
                                        }
                                        return 1;
                                    })
                            )
                    )
            )
            
            // List PDO items
            .then(
                Commands.literal('list')
                    .executes(context => {
                        const admin = context.source.player;
                        const pdoItems = Object.keys(PDO_CONFIG);
                        
                        if (pdoItems.length > 0) {
                            admin.tell('§6Available PDO Items:');
                            pdoItems.forEach(itemName => {
                                const config = PDO_CONFIG[itemName];
                                const item = config.item || 'unknown';
                                const playerCount = config.allowedPlayers ? config.allowedPlayers.length : 0;
                                admin.tell(` §e- §b${itemName}§e (Item: §a${item}§e, Players: §a${playerCount}§e)`);
                            });
                        } else {
                            admin.tell('§cThere are no PDO items defined.');
                        }
                        return 1;
                    })
            )
            
            // Show details of specific PDO item
            .then(
                Commands.literal('info')
                    .then(
                        Commands.argument('pdoItemName', StringArgumentType.greedyString())
                            .suggests((context, builder) => {
                                // Suggest available PDO items
                                Object.keys(PDO_CONFIG).forEach(itemName => {
                                    builder.suggest(itemName);
                                });
                                return builder.buildFuture();
                            })
                            .executes(context => {
                                const admin = context.source.player;
                                const pdoItemName = StringArgumentType.getString(context, 'pdoItemName');
                                
                                if (!PDO_CONFIG[pdoItemName]) {
                                    admin.tell(`§cPDO item "${pdoItemName}" does not exist.`);
                                    return 0;
                                }
                                
                                const config = PDO_CONFIG[pdoItemName];
                                
                                admin.tell(`§6PDO Item: §b${pdoItemName}`);
                                admin.tell(`§6Item ID: §a${config.item || 'Not specified'}`);
                                admin.tell(`§6Custom Name: §a${config.name || 'Default PDO format'}`);
                                
                                if (config.tooltips && config.tooltips.length > 0) {
                                    admin.tell('§6Tooltips:');
                                    config.tooltips.forEach(tooltip => {
                                        admin.tell(` §7- ${tooltip}`);
                                    });
                                } else {
                                    admin.tell('§6Tooltips: §7None');
                                }
                                
                                if (config.allowedPlayers && config.allowedPlayers.length > 0) {
                                    admin.tell('§6Allowed Players:');
                                    config.allowedPlayers.forEach(player => {
                                        admin.tell(` §7- ${player}`);
                                    });
                                } else {
                                    admin.tell('§6Allowed Players: §7None (Only operators can use)');
                                }
                                
                                return 1;
                            })
                    )
            )
    );
});

// Apply a PDO item to the player's currently held item
function applyPdoItem(player, pdoItemName) {
    const mainHandItem = player.getMainHandItem();
    
    if (mainHandItem.isEmpty()) {
        player.tell('§cYou need to hold an item to apply a PDO item name.');
        console.log(`[PDO Command] Failed - ${player.username} not holding an item`);
        return false;
    }
    
    // Check if the item already has a PDO tag using proper NBT check
    if (mainHandItem.nbt && mainHandItem.nbt.contains('pdo')) {
        player.tell('§cThis item already has a PDO applied to it.');
        console.log(`[PDO Command] Failed - item already has PDO tag`);
        return false;
    }
    
    // Get the PDO item configuration
    const pdoConfig = PDO_CONFIG[pdoItemName];
    
    // Check if the held item matches the required item type
    if (pdoConfig.item && !mainHandItem.id.equals(pdoConfig.item)) {
        player.tell(`§cThis PDO item can only be applied to: §e${pdoConfig.item}`);
        console.log(`[PDO Command] Failed - wrong item type. Expected ${pdoConfig.item}, got ${mainHandItem.id}`);
        return false;
    }
    
    // Record the original count and item details
    const count = mainHandItem.count;
    const itemID = mainHandItem.id;
    
    // Create a new NBT compound if none exists, or copy the existing one
    let nbt = mainHandItem.nbt ? mainHandItem.nbt.copy() : {};
    
    // Mark as PDO item - using proper NBT setting
    nbt.pdo = true;
    
    // Create the new item with the updated NBT
    let newItem = Item.of(itemID, nbt);
    
    // Apply custom name
    if (pdoConfig.name) {
        newItem = newItem.withName(Text.of(pdoConfig.name));
    } else {
        newItem = newItem.withName(Text.gold('PDO Item: ').append(Text.aqua(pdoItemName)));
    }
    
    // Add tooltips if specified
    if (pdoConfig.tooltips && pdoConfig.tooltips.length > 0) {
        lore = pdoConfig.tooltips.map(line => Text.gray(line));
        newItem = newItem.withLore(lore);
    }
    
    // Set the count to match the original stack
    newItem.count = count;
    
    // Clear the main hand item
    player.mainHandItem = Item.of('minecraft:air');
    
    // Give the new PDO item to the player with the same count as original
    player.give(newItem);
    
    player.tell(Text.of(`§aApplied PDO §6"${pdoItemName}"§a to your item.`));
    console.log(`[PDO Command] Success - ${player.username} applied PDO item "${pdoItemName}"`);
    return true;
}

// Log initialization
console.log("[PDO System] Initialized with predefined PDO items");
