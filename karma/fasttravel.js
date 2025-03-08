// Fast Travel Configuration
const FAST_TRAVEL_CONFIG = {
    karmaCostPer100Blocks: 6,
    minKarmaCost: 5,
    teleportHeight: 240,
    randomVariation: 20,
    coordinateBounds: {
        min: -2500,
        max: 2500
    },
    teleportDelay: 0,
    slowFallingEffect: {
        duration: 600, // 30 seconds
        level: 0
    }
};

// Coordinate utilities
const CoordUtils = {
    calculateDistance(x1, z1, x2, z2) {
        const deltaX = x2 - x1;
        const deltaZ = z2 - z1;
        return Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    },

    calculateKarmaCost(currentX, currentZ, targetX, targetZ) {
        const distance = this.calculateDistance(currentX, currentZ, targetX, targetZ);
        return Math.max(
            FAST_TRAVEL_CONFIG.minKarmaCost, 
            Math.ceil(distance / 100) * FAST_TRAVEL_CONFIG.karmaCostPer100Blocks
        );
    },

    applyRandomVariation(x, z) {
        const { randomVariation } = FAST_TRAVEL_CONFIG;
        const variationX = Math.floor(Math.random() * (randomVariation * 2 + 1)) - randomVariation;
        const variationZ = Math.floor(Math.random() * (randomVariation * 2 + 1)) - randomVariation;
        return { x: x + variationX, z: z + variationZ };
    },

    isValidCoordinate(x, z) {
        const { min, max } = FAST_TRAVEL_CONFIG.coordinateBounds;
        return x >= min && x <= max && z >= min && z <= max;
    }
};

// Fast travel core logic
function performFastTravel(player, targetX, targetZ) {

    // Check if player is in Overworld
    if (player.level.dimension.toString() !== 'minecraft:overworld') {
        player.tell('§cFast travel is only available in the Overworld.');
        return false;
    }
    
    const server = Utils.server;
    const currentPos = player.blockPosition();
    const currentX = Math.floor(currentPos.x);
    const currentZ = Math.floor(currentPos.z);

    // Validate coordinates
    if (!CoordUtils.isValidCoordinate(targetX, targetZ)) {
        player.tell(`§cInvalid coordinates. Must be between ${FAST_TRAVEL_CONFIG.coordinateBounds.min} and ${FAST_TRAVEL_CONFIG.coordinateBounds.max}.`);
        return false;
    }

    // Calculate karma cost
    const karmaCost = CoordUtils.calculateKarmaCost(currentX, currentZ, targetX, targetZ);
    const remainingKarma = player.persistentData.karmaPoints || 0;

    // Check karma sufficiency
    if (remainingKarma < karmaCost) {
        player.tell(`§cInsufficient karma. You need ${karmaCost}, but have only ${remainingKarma}.`);
        return false;
    }

    // Teleport scheduling
    server.scheduleInTicks(FAST_TRAVEL_CONFIG.teleportDelay, () => {
        // Apply teleport
        const { x: finalX, z: finalZ } = CoordUtils.applyRandomVariation(targetX, targetZ);
        player.teleportTo(
            player.level.dimension, 
            finalX, 
            FAST_TRAVEL_CONFIG.teleportHeight, 
            finalZ, 
            0, 
            0
        );

        // Apply slow falling effect
        player.potionEffects.add(
            "minecraft:slow_falling", 
            FAST_TRAVEL_CONFIG.slowFallingEffect.duration, 
            FAST_TRAVEL_CONFIG.slowFallingEffect.level, 
            false, 
            false
        );

        // Update karma and notify
        player.persistentData.karmaPoints = remainingKarma - karmaCost;
        player.tell(`§aTeleported to (${finalX}, ${FAST_TRAVEL_CONFIG.teleportHeight}, ${finalZ}). Karma spent: ${karmaCost}`);
    });

    return true;
}

// Command registration
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const IntegerArgumentType = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType');

    event.register(Commands.literal('fasttravel')
        .then(Commands.argument('x', IntegerArgumentType.integer())
            .then(Commands.argument('z', IntegerArgumentType.integer())
                .executes(ctx => {
                    const player = ctx.source.player;
                    if (!player) {
                        ctx.source.sendFailure("§cPlayer-only command.");
                        return 0;
                    }

                    const targetX = IntegerArgumentType.getInteger(ctx, 'x');
                    const targetZ = IntegerArgumentType.getInteger(ctx, 'z');

                    return performFastTravel(player, targetX, targetZ) ? 1 : 0;
                })
            )
        )
    );
});
