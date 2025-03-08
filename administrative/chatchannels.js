// chatChannels.js
// Handles chat channels for server messaging

// Configuration for channels
const CHANNELS = {
    GLOBAL: {
        id: 'global',
        displayName: '[Global]',
        description: 'Public chat visible to all players (Default)',
        color: '§f',
        command: null // No cmd for global chat (default)
    },
    LOCAL: {
        id: 'local',
        displayName: '§b[Local]§r',
        description: 'Nearby players only (50 block radius)',
        color: '§e',
        radius: 50,
        command: 'l'
    },
    MATURE: {
        id: 'mature',
        displayName: '§c[Mature]§r',
        description: 'Age-restricted channel for mature content',
        color: '§c',
        ageRestricted: true,
        command: 'm'
    },
    TRADING: {
        id: 'trading',
        displayName: '§b[Trading]§r',
        description: 'Trades, barters, diplomacy, etc.!',
        color: '§b',
        command: 'tr'
    },
    ADMIN: {
        id: 'admin',
        displayName: '§9[Admin]§r',
        description: 'Staff-only communication channel',
        color: '§9',
        permissionKey: 'isStaff',
        command: 'adm'
    },
    SENSITIVE: {
        id: 'sensitive',
        displayName: '§6[Sensitive]§r',
        description: 'Discussions around more sensitive topics. (NO mature content.)',
        color: '§9',
        command: 's'
    }
};

// Helper: Format chat message
function formatChatMessage(player, message, channel) {
    const rawDisplayName = player.displayName.getString 
        ? player.displayName.getString() 
        : String(player.displayName);
    
    const match = rawDisplayName.match(/^([^\w\s]\s)?(.*)$/);
    const unicodePrefix = match && match[1] ? match[1] : "";
    const restOfName = match && match[2] ? match[2] : rawDisplayName;
    
    const nameColorCode = channel.id === CHANNELS.LOCAL.id ? 'a§l' : 'e';

    if (channel.id === CHANNELS.GLOBAL.id || channel.id === CHANNELS.LOCAL.id) {
        // regular chat, no prefix
        return `§f${unicodePrefix}§${nameColorCode}${restOfName} §7» §f${message}`;
    } else {
        return `§${channel.color[1]}${channel.displayName} §f${unicodePrefix}§${nameColorCode}${restOfName} §7» §f${message}`;
    }
}

// Send message to a channel
function sendChannelMessage(player, channel, message) {
    const server = player.server;
    
    console.log(`[${channel.id.toUpperCase()}] ${player.name.string}: ${message}`);
    
    if (channel.id === CHANNELS.GLOBAL.id) {
        server.tell([
            formatChatMessage(player, message, channel)
        ]);
    } else if (channel.id === CHANNELS.LOCAL.id) {
        // check each player for local channel
        server.players.forEach(recipient => {
            const recipientChannels = getJoinedChannels(recipient);
            if (!recipientChannels.includes(channel.id)) {
                return;
            }
            if (recipient.level.dimension !== player.level.dimension) {
                return;
            }
            
            // pos to number just to be absolutely sure. local gave us a lot of headache in development
            const senderX = Number(player.x);
            const senderY = Number(player.y);
            const senderZ = Number(player.z);
            const recipientX = Number(recipient.x);
            const recipientY = Number(recipient.y);
            const recipientZ = Number(recipient.z);
            
            // Calculate differences and squared distance
            const dx = senderX - recipientX;
            const dy = senderY - recipientY;
            const dz = senderZ - recipientZ;
            const distanceSquared = dx * dx + dy * dy + dz * dz;
            const radiusSquared = channel.radius * channel.radius;
            const isSender = recipient === player;
            const isNearby = !isSender && distanceSquared <= radiusSquared;
            
            if (isSender || isNearby) {
                recipient.tell(formatChatMessage(player, message, channel));
            }
        });
    } else {
        // non-local/non-global channels: send message to all players that have joined the channel
        server.players.forEach(recipient => {
            const recipientChannels = getJoinedChannels(recipient);
            if (!recipientChannels.includes(channel.id)) return;
            recipient.tell(formatChatMessage(player, message, channel));
        });
    }
}

// just super redundant stuff again, because of issues in development
PlayerEvents.loggedIn(event => {
    const player = event.player;
    
    const joinedChannels = getJoinedChannels(player);
    let channelsChanged = false;
    
    if (!joinedChannels.includes(CHANNELS.GLOBAL.id)) {
        joinedChannels.push(CHANNELS.GLOBAL.id);
        channelsChanged = true;
    }
    
    if (!joinedChannels.includes(CHANNELS.LOCAL.id)) {
        joinedChannels.push(CHANNELS.LOCAL.id);
        channelsChanged = true;
    }
    
    if (channelsChanged) {
        player.persistentData.joinedChannels = JSON.stringify(joinedChannels);
    }
});

// global chat
PlayerEvents.chat(event => {

    if (event.message.startsWith('/')) return;

    const player = event.player;
    const message = event.message;

    sendChannelMessage(player, CHANNELS.GLOBAL, message);
    event.cancel()
});

// Command registrations for channel management
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const StringArgumentType = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType');
    const Text = Java.loadClass('net.minecraft.network.chat.Component');
    
    function suggestChannels(context, builder) {
        Object.values(CHANNELS).forEach(channel => {
            builder.suggest(channel.id);
        });
        return builder.buildFuture();
    }
    
    // suggest joinable channels for a player
    function suggestJoinableChannels(context, builder) {
        const player = context.source.player;
        if (!player) return builder.buildFuture();
        
        const joinedChannels = getJoinedChannels(player);
        Object.values(CHANNELS).forEach(channel => {
            if (!joinedChannels.includes(channel.id)) {
                builder.suggest(channel.id);
            }
        });
        return builder.buildFuture();
    }
    
    // suggest channels a player can leave
    function suggestLeavableChannels(context, builder) {
        const player = context.source.player;
        if (!player) return builder.buildFuture();
        
        const joinedChannels = getJoinedChannels(player);
        joinedChannels.forEach(channelId => {
            // Can't leave global or local
            if (channelId !== CHANNELS.GLOBAL.id && channelId !== CHANNELS.LOCAL.id) {
                builder.suggest(channelId);
            }
        });
        return builder.buildFuture();
    }
    
    // suggest player names
    function suggestPlayers(context, builder) {
        const players = context.source.server.getPlayers();
        for (let i = 0; i < players.size(); i++) {
            builder.suggest(players.get(i).getName().getString());
        }
        return builder.buildFuture();
    }
    
    // suggest permission keys from channel config
    function suggestPermissionKeys(context, builder) {
        Object.values(CHANNELS).forEach(channel => {
            if (channel.permissionKey) {
                builder.suggest(channel.permissionKey);
            }
        });
        return builder.buildFuture();
    }
    
    // suggest player-specific permission keys
    function suggestPlayerPermissionKeys(context, builder) {
        const playerName = StringArgumentType.getString(context, 'player');
        const player = context.source.server.getPlayer(playerName);
        
        if (player) {
            // Get all permission keys from channel config
            Object.values(CHANNELS).forEach(channel => {
                if (channel.permissionKey && player.persistentData.getBoolean(channel.permissionKey)) {
                    builder.suggest(channel.permissionKey);
                }
            });
        }
        return builder.buildFuture();
    }
    
    // List channels command
    event.register(
        Commands.literal('channels')
            .executes(context => {
                const player = context.source.player;
                if (!player) {
                    context.source.sendFailure(Text.literal("This command can only be executed by a player"));
                    return 0;
                }
                
                listChannels(player);
                return 1;
            })
    );
    
    // Join channel command
    event.register(
        Commands.literal('join')
            .then(
                Commands.argument('channel', StringArgumentType.word())
                    .suggests(suggestJoinableChannels)
                    .executes(context => {
                        const player = context.source.player;
                        if (!player) {
                            context.source.sendFailure(Text.literal("This command can only be executed by a player"));
                            return 0;
                        }
                        
                        const channelId = StringArgumentType.getString(context, 'channel').toLowerCase();
                        return joinChannel(player, channelId);
                    })
            )
            .executes(context => {
                context.source.sendFailure(Text.literal("Please specify a channel to join"));
                return 0;
            })
    );
    
    // Leave channel cmd
    event.register(
        Commands.literal('leave')
            .then(
                Commands.argument('channel', StringArgumentType.word())
                    .suggests(suggestLeavableChannels)
                    .executes(context => {
                        const player = context.source.player;
                        if (!player) {
                            context.source.sendFailure(Text.literal("This command can only be executed by a player"));
                            return 0;
                        }
                        
                        const channelId = StringArgumentType.getString(context, 'channel').toLowerCase();
                        return leaveChannel(player, channelId);
                    })
            )
            .executes(context => {
                context.source.sendFailure(Text.literal("Please specify a channel to leave"));
                return 0;
            })
    );
    
    // Register a command for each channel that has a command specified
    Object.values(CHANNELS).forEach(channel => {
        if (!channel.command) return; // Skip channels without commands (like Global)
        
        // Register the command to send a message to that channel
        event.register(
            Commands.literal(channel.command)
                .then(
                    Commands.argument('message', StringArgumentType.greedyString())
                        .executes(context => {
                            const player = context.source.player;
                            if (!player) {
                                context.source.sendFailure(Text.literal("This command can only be executed by a player"));
                                return 0;
                            }
                            
                            const message = StringArgumentType.getString(context, 'message');
                            const joinedChannels = getJoinedChannels(player);
                            
                            // Check if player has joined this channel
                            if (!joinedChannels.includes(channel.id)) {
                                player.tell(`§cYou need to join the ${channel.displayName}§c channel first. Use /join ${channel.id}`);
                                return 0;
                            }
                            
                            // Check permission for the channel
                            if (channel.permissionKey && !player.persistentData.getBoolean(channel.permissionKey)) {
                                player.tell(`§cYou don't have permission to use the ${channel.displayName}§c channel.`);
                                return 0;
                            }
                            
                            // Send the message to the channel and cancel the event to hide from Discord
                            sendChannelMessage(player, channel, message);
                            return 1;
                        })
                )
                .executes(context => {
                    context.source.sendFailure(Text.literal(`§cPlease include a message. Usage: /${channel.command} <message>`));
                    return 0;
                })
        );
    });

    // Command to list players in a channel
    event.register(
        Commands.literal('chlist')
            .requires(source => source.hasPermission(2))
            .then(
                Commands.argument('channel', StringArgumentType.word())
                    .suggests(suggestChannels)
                    .executes(context => {
                        const source = context.source;
                        const server = source.server;
                        const channelId = StringArgumentType.getString(context, 'channel').toLowerCase();
                        
                        const channel = getChannelById(channelId);
                        if (!channel) {
                            source.sendFailure(Text.literal(`§c'${channelId}' is not a valid channel.`));
                            return 0;
                        }
                        
                        // Collect players in the channel
                        const playersInChannel = [];
                        
                        server.players.forEach(player => {
                            const joinedChannels = getJoinedChannels(player);
                            if (joinedChannels.includes(channel.id)) {
                                playersInChannel.push({
                                    name: player.name.string
                                });
                            }
                        });
                        
                        if (playersInChannel.length === 0) {
                            source.sendSuccess(Text.literal(`§eNo online players are in the ${channel.displayName}§e channel.`), false);
                            return 1;
                        }
                        
                        // Show results
                        source.sendSuccess(Text.literal(`§8=== §6Players in ${channel.displayName}§6 (${playersInChannel.length} total) §8===`), false);
                        
                        // alphabetically
                        playersInChannel.sort((a, b) => a.name.localeCompare(b.name));
                        
                        playersInChannel.forEach(player => {
                            source.sendSuccess(Text.literal(`§f${player.name}`), false);
                        });
                        
                        return 1;
                    })
            )
            .executes(context => {
                context.source.sendFailure(Text.literal("§cPlease specify a channel. Usage: /chlist <channel>"));
                return 0;
            })
    );

    // Kick from channel command
    event.register(
        Commands.literal('chkick')
            .requires(source => source.hasPermission(2)) // Requires OP level 2+
            .then(
                Commands.argument('player', StringArgumentType.word())
                    .suggests(suggestPlayers)
                    .then(
                        Commands.argument('channel', StringArgumentType.word())
                            .suggests((context, builder) => {
                                // Suggest all channels except global and local
                                Object.values(CHANNELS).forEach(channel => {
                                    if (channel.id !== CHANNELS.GLOBAL.id && channel.id !== CHANNELS.LOCAL.id) {
                                        builder.suggest(channel.id);
                                    }
                                });
                                return builder.buildFuture();
                            })
                            .executes(context => {
                                const source = context.source;
                                const server = source.server;
                                const playerName = StringArgumentType.getString(context, 'player');
                                const channelId = StringArgumentType.getString(context, 'channel').toLowerCase();
                                
                                // Check if channel exists
                                const channel = getChannelById(channelId);
                                if (!channel) {
                                    source.sendFailure(Text.literal(`§c'${channelId}' is not a valid channel.`));
                                    return 0;
                                }
                                
                                // Can't remove from Global or Local
                                if (channel.id === CHANNELS.GLOBAL.id || channel.id === CHANNELS.LOCAL.id) {
                                    source.sendFailure(Text.literal(`§cPlayers cannot be removed from the ${channel.id === CHANNELS.GLOBAL.id ? 'Global' : 'Local'} channel.`));
                                    return 0;
                                }
                                
                                // Find player
                                const targetPlayer = server.getPlayer(playerName);
                                if (!targetPlayer) {
                                    source.sendFailure(Text.literal(`§cPlayer ${playerName} not found or is offline.`));
                                    return 0;
                                }
                                
                                // Check if player is in channel
                                const joinedChannels = getJoinedChannels(targetPlayer);
                                if (!joinedChannels.includes(channel.id)) {
                                    source.sendFailure(Text.literal(`§c${playerName} is not in the ${channel.displayName}§c channel.`));
                                    return 0;
                                }
                                
                                // Remove player from channel
                                const newJoinedChannels = joinedChannels.filter(c => c !== channel.id);
                                targetPlayer.persistentData.joinedChannels = JSON.stringify(newJoinedChannels);
                                
                                targetPlayer.tell(`§cYou have been removed from the ${channel.displayName}§c channel by a moderator.`);
                                
                                // Log the action
                                console.log(`[ADMIN] ${source.player ? source.player.name.string : "Console"} removed ${playerName} from ${channel.id} channel`);
                                
                                // Notify moderators
                                server.players.filter(p => p.persistentData.getBoolean('isStaff')).forEach(admin => {
                                    if (admin !== source.player) { // Don't notify the admin who executed the command
                                        admin.tell(`§8[Admin] §7${source.player ? source.player.name.string : "Console"} removed ${playerName} from the ${channel.displayName}§7 channel.`);
                                    }
                                });
                                
                                source.sendSuccess(Text.literal(`§aSuccessfully removed §e${playerName}§a from the ${channel.displayName}§a channel.`), true);
                                return 1;
                            })
                    )
            )
            .executes(context => {
                context.source.sendFailure(Text.literal("§cUsage: /chkick <player> <channel>"));
                return 0;
            })
    );

    // Permission key mgmt
    event.register(
        Commands.literal('chperm')
            .requires(source => source.hasPermission(2))
            .then(
                Commands.literal('add')
                    .then(
                        Commands.argument('player', StringArgumentType.word())
                            .suggests(suggestPlayers)
                            .then(
                                Commands.argument('key', StringArgumentType.word())
                                    .suggests(suggestPermissionKeys)
                                    .executes(context => {
                                        const source = context.source;
                                        const server = source.server;
                                        const playerName = StringArgumentType.getString(context, 'player');
                                        const permKey = StringArgumentType.getString(context, 'key');
                                        
                                        // Find player
                                        const targetPlayer = server.getPlayer(playerName);
                                        if (!targetPlayer) {
                                            source.sendFailure(Text.literal(`§cPlayer ${playerName} not found or is offline.`));
                                            return 0;
                                        }
                                        
                                        // This is the key fix - use the NBT method for persistentData
                                        // Set permission key to true (using boolean NBT tag)
                                        targetPlayer.persistentData.putBoolean(permKey, true);
                                        
                                        // Log the action
                                        const adminName = source.player ? source.player.name.string : "Console";
                                        console.log(`[ADMIN] ${adminName} added permission key '${permKey}' to player ${playerName}`);
                                        
                                        // Notify moderators
                                        server.players.forEach(admin => {
                                            if (admin.persistentData.getBoolean('isStaff') && admin !== source.player) {
                                                admin.tell(`§8[Admin] §7${adminName} added permission key '${permKey}' to ${playerName}.`);
                                            }
                                        });
                                        
                                        source.sendSuccess(Text.literal(`§aAdded permission key '§e${permKey}§a' to §e${playerName}§a.`), true);
                                        return 1;
                                    })
                            )
                    )
                    .executes(context => {
                        context.source.sendFailure(Text.literal("§cUsage: /chperm add <player> <key>"));
                        return 0;
                    })
            )
            .then(
                Commands.literal('remove')
                    .then(
                        Commands.argument('player', StringArgumentType.word())
                            .suggests(suggestPlayers)
                            .then(
                                Commands.argument('key', StringArgumentType.word())
                                    .suggests(suggestPlayerPermissionKeys)
                                    .executes(context => {
                                        const source = context.source;
                                        const server = source.server;
                                        const playerName = StringArgumentType.getString(context, 'player');
                                        const permKey = StringArgumentType.getString(context, 'key');
                                        
                                        // Find player
                                        const targetPlayer = server.getPlayer(playerName);
                                        if (!targetPlayer) {
                                            source.sendFailure(Text.literal(`§cPlayer ${playerName} not found or is offline.`));
                                            return 0;
                                        }
                                        
                                        // Check if the key exists
                                        if (!targetPlayer.persistentData.getBoolean(permKey)) {
                                            source.sendFailure(Text.literal(`§cPlayer ${playerName} does not have the permission key '${permKey}'.`));
                                            return 0;
                                        }
                                        
                                        // Remove permission key
                                        targetPlayer.persistentData.remove(permKey);
                                        
                                        // Log the action
                                        const adminName = source.player ? source.player.name.string : "Console";
                                        console.log(`[ADMIN] ${adminName} removed permission key '${permKey}' from player ${playerName}`);
                                        
                                        // Notify moderators
                                        server.players.forEach(admin => {
                                            if (admin.persistentData.getBoolean('isStaff') && admin !== source.player) {
                                                admin.tell(`§8[Admin] §7${adminName} removed permission key '${permKey}' from ${playerName}.`);
                                            }
                                        });
                                        
                                        source.sendSuccess(Text.literal(`§aRemoved permission key '§e${permKey}§a' from §e${playerName}§a.`), true);
                                        return 1;
                                    })
                            )
                    )
                    .executes(context => {
                        context.source.sendFailure(Text.literal("§cUsage: /chperm remove <player> <key>"));
                        return 0;
                    })
            )
            .then(
                Commands.literal('list')
                    .then(
                        Commands.argument('player', StringArgumentType.word())
                            .suggests(suggestPlayers)
                            .executes(context => {
                                const source = context.source;
                                const server = source.server;
                                const playerName = StringArgumentType.getString(context, 'player');
                                
                                // Find player
                                const targetPlayer = server.getPlayer(playerName);
                                if (!targetPlayer) {
                                    source.sendFailure(Text.literal(`§cPlayer ${playerName} not found or is offline.`));
                                    return 0;
                                }
                                
                                // Get all permission keys for the player
                                const permissionKeys = [];
                                
                                // Check if player has each permission key from channel config
                                Object.values(CHANNELS).forEach(channel => {
                                    if (channel.permissionKey && targetPlayer.persistentData.getBoolean(channel.permissionKey)) {
                                        permissionKeys.push(channel.permissionKey);
                                    }
                                });
                                
                                if (permissionKeys.length === 0) {
                                    source.sendSuccess(Text.literal(`§ePlayer §f${playerName}§e has no permission keys.`), false);
                                    return 1;
                                }
                                
                                // Sort keys alphabetically
                                permissionKeys.sort();
                                
                                // Show results
                                source.sendSuccess(Text.literal(`§8=== §6Permission Keys for §f${playerName} §8===`), false);
                                permissionKeys.forEach(key => {
                                    source.sendSuccess(Text.literal(`§7- §a${key}`), false);
                                });
                                
                                return 1;
                            })
                    )
                    .executes(context => {
                        context.source.sendFailure(Text.literal("§cUsage: /chperm list <player>"));
                        return 0;
                    })
            )
            .executes(context => {
                context.source.sendFailure(Text.literal("§cUsage: /chperm <add|remove|list> <player> [key]"));
                return 0;
            })
    );
});

// -----------------------------
// Helper Functions for channel management
// -----------------------------
function getChannelById(id) {
    for (let key in CHANNELS) {
        if (CHANNELS[key].id === id) {
            return CHANNELS[key];
        }
    }
    return CHANNELS.GLOBAL;
}

function hasChannelPermission(player, channel) {
    if (channel.id === CHANNELS.GLOBAL.id || channel.id === CHANNELS.LOCAL.id) {
        return true;
    }
    if (channel.permissionKey) {
        return player.persistentData.getBoolean(channel.permissionKey) === true;
    }
    return true;
}

function listChannels(player) {
    player.tell('§8=== §6Available Chat Channels §8===');
    const joinedChannels = getJoinedChannels(player);
    
    Object.values(CHANNELS).forEach(channel => {
        const hasPermission = hasChannelPermission(player, channel);
        let status = '';
        
        if (joinedChannels.includes(channel.id)) {
            status = '§a[Joined]';
        } else if (hasPermission) {
            status = '§7[Available]';
        } else {
            status = '§c[No Access]';
        }
        
        const commandInfo = channel.command ? `§7(/${channel.command} <msg>)§r` : '§7(default)§r';
        const displayName = channel.displayName;
        
        player.tell(`${displayName} ${status} ${commandInfo} §8- ${channel.description}`);
    });
    
    player.tell('§8== §7Commands: /join <channel>, /leave <channel>');
    player.tell('§8== §7Regular chat goes to Global by default, use commands for other channels');
}

function joinChannel(player, channelId) {
    const channel = getChannelById(channelId);
    if (!channel) {
        player.tell(`§c'${channelId}' is not a valid channel. Use /channels to see available options.`);
        return 0;
    }
    
    // Check permission
    if (!hasChannelPermission(player, channel)) {
        player.tell(`§cYou don't have permission to join the ${channel.displayName}§c channel.`);
        return 0;
    }
    
    const joinedChannels = getJoinedChannels(player);
    if (joinedChannels.includes(channel.id)) {
        player.tell(`§cYou are already in the ${channel.displayName}§c channel.`);
        return 0;
    }
    
    // Age verification for mature channel
    if (channel.ageRestricted) {
        if (!player.persistentData.ageVerified) {
            player.tell(`§c⚠ The ${channel.displayName}§c channel contains mature content.`);
            player.tell('§cBy joining, you confirm that you are 18+ years old.');
            player.tell('§cAnyone found to be underage in this channel is subject to a ban.');
            player.tell(`§6Run the /join command again to confirm and join.`);
            player.persistentData.ageVerified = true;
            return 1;
        } else {
            delete player.persistentData.ageVerified;
        }
    }
    
    joinedChannels.push(channel.id);
    player.persistentData.joinedChannels = JSON.stringify(joinedChannels);
    
    let joinMessage = `§aYou joined the ${channel.displayName}§a channel.`;
    
    if (channel.command) {
        joinMessage += ` Use §e/${channel.command} <message>§a to talk in this channel.`;
    }
    
    player.tell(joinMessage);
    
    if (channel.id === CHANNELS.MATURE.id) {
        player.server.players.filter(p => p.persistentData.isStaff === true)
            .forEach(admin => {
                admin.tell(`§8[Admin] §7Player ${player.name.string} joined the Mature channel.`);
            });
    }
    
    return 1;
}

function leaveChannel(player, channelId) {
    const channel = getChannelById(channelId);
    if (!channel) {
        player.tell(`§c'${channelId}' is not a valid channel. Use /channels to see available options.`);
        return 0;
    }
    
    if (channel.id === CHANNELS.GLOBAL.id) {
        player.tell('§cYou cannot leave the Global channel.');
        return 0;
    }
    
    if (channel.id === CHANNELS.LOCAL.id) {
        player.tell('§cYou cannot leave the Local channel.');
        return 0;
    }
    
    const joinedChannels = getJoinedChannels(player);
    if (!joinedChannels.includes(channel.id)) {
        player.tell(`§cYou are not in the ${channel.displayName}§c channel.`);
        return 0;
    }
    
    const newJoinedChannels = joinedChannels.filter(c => c !== channel.id);
    player.persistentData.joinedChannels = JSON.stringify(newJoinedChannels);
    
    player.tell(`§aYou left the ${channel.displayName}§a channel.`);
    
    return 1;
}

function getJoinedChannels(player) {
    if (!player.persistentData.joinedChannels) {
        return [CHANNELS.GLOBAL.id, CHANNELS.LOCAL.id];
    }
    
    try {
        let channels = JSON.parse(player.persistentData.joinedChannels);
        
        if (!channels.includes(CHANNELS.GLOBAL.id)) {
            channels.push(CHANNELS.GLOBAL.id);
        }
        
        if (!channels.includes(CHANNELS.LOCAL.id)) {
            channels.push(CHANNELS.LOCAL.id);
        }
        
        return channels;
    } catch (e) {
        console.error(`Error parsing joined channels for player ${player.name.string}: ${e}`);
        return [CHANNELS.GLOBAL.id, CHANNELS.LOCAL.id];
    }
}
