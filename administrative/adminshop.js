global.playerPositions = global.playerPositions || {};
global.teleportTasks = global.teleportTasks || {};

// Constants
const SHOP = {
    DIMENSION: "landfall:limbo",
    X: 11,
    Y: 275,
    Z: 22,
    RADIUS: 400
};

const FALLBACK = {
    DIMENSION: "minecraft:overworld",
    X: 0,
    Y: 115,
    Z: 0
};

// Variable declarations bc I'm lazy :D
let player;
let playerUUID;
let currentPos;
let currentDim;
let startPos;
let distance;
let isInShop;
let savedPos;
let newPos;

// Helper function to clean up teleport task
function cleanupTeleportTask(playerUUID) {
    if (global.teleportTasks[playerUUID]) {
        delete global.teleportTasks[playerUUID];
    }
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(Commands.literal('a')
        .executes(ctx => {
            // Assign variables at the start of the command execution
            player = ctx.source.player;

            if (!player) {
                ctx.source.sendFailure("§cThis command can only be executed by a player.");
                return 0;
            }

            playerUUID = player.uuid.toString();
            currentPos = player.blockPosition();
            currentDim = player.level.dimension.toString();
            startPos = {
                x: Math.floor(currentPos.x),
                y: Math.floor(currentPos.y),
                z: Math.floor(currentPos.z)
            };

            distance = Math.sqrt(
                Math.pow(currentPos.x - SHOP.X, 2) +
                Math.pow(currentPos.y - SHOP.Y, 2) +
                Math.pow(currentPos.z - SHOP.Z, 2)
            );

            isInShop = currentDim === SHOP.DIMENSION && distance <= SHOP.RADIUS;

            // Handle shop logic
            if (isInShop) {
                savedPos = global.playerPositions[playerUUID];
                if (savedPos) {
                    Utils.server.runCommandSilent(`gamemode survival ${player.username}`);
                    player.teleportTo(
                        savedPos.dimension,
                        savedPos.x,
                        savedPos.y,
                        savedPos.z,
                        0,
                        0
                    );
                    delete global.playerPositions[playerUUID];
                    player.tell("§aYou have been teleported back to your previous location!");
                } else {
                    Utils.server.runCommandSilent(`gamemode survival ${player.username}`);
                    player.teleportTo(
                        FALLBACK.DIMENSION,
                        FALLBACK.X,
                        FALLBACK.Y,
                        FALLBACK.Z,
                        0,
                        0
                    );
                    player.tell("§cCould not find your saved position. Teleported to spawn.");
                }
		Utils.server.runCommandSilent(`locinfo ${player.username} caldora`);
                return 1;
            }

            // Check if there's an existing teleport task and clean it up
            cleanupTeleportTask(playerUUID);

            // Start teleportation sequence
            player.tell("§eTeleporting in 3 seconds... Do not move!");

            // Store the task information
            global.teleportTasks[playerUUID] = {
                startTime: Date.now(),
                startPos: startPos
            };

            // Schedule countdown messages
            Utils.server.schedule(1000, () => {
                if (global.teleportTasks[playerUUID]) {
                    player.tell("§e2...");
                }
            });

            Utils.server.schedule(2000, () => {
                if (global.teleportTasks[playerUUID]) {
                    player.tell("§e1...");
                }
            });

            // Schedule the actual teleport for 3 seconds (60 ticks)
            Utils.server.schedule(3000, () => {
                try {
                    // Check if the task is still valid
                    if (!global.teleportTasks[playerUUID]) {
                        return;
                    }

                    newPos = player.blockPosition();
                    if (Math.floor(newPos.x) !== startPos.x ||
                        Math.floor(newPos.y) !== startPos.y ||
                        Math.floor(newPos.z) !== startPos.z) {
                        player.tell("§cTeleportation canceled! You moved.");
                        cleanupTeleportTask(playerUUID);
                        return;
                    }

                    global.playerPositions[playerUUID] = {
                        x: startPos.x,
                        y: startPos.y,
                        z: startPos.z,
                        dimension: currentDim
                    };

                    Utils.server.runCommandSilent(`gamemode adventure ${player.username}`);
		    Utils.server.runCommandSilent(`locinfo ${player.username} limbo`);
                    player.teleportTo(
                        SHOP.DIMENSION,
                        SHOP.X,
                        SHOP.Y,
                        SHOP.Z,
                        0,
                        0
                    );
                    player.tell("§aWelcome to the Admin Shop!");
                    player.tell("§7Run the command again to return.");
                } catch (error) {
                    player.tell("§cError during teleportation: " + error);
                } finally {
                    cleanupTeleportTask(playerUUID);
                }
            });

            return 1;
        })
    );
});
