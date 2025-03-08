// last resort clean-slate script. this will break stuff.

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(Commands.literal('clearpersistentdata')
        .requires(source => source.hasPermission(2))
        .executes(ctx => {
            const player = ctx.source.player;
            if (!player) {
                ctx.source.sendFailure("§cThis command can only be executed by a player.");
                return 0;
            }

            // Clear all keys in the persistentData
            Object.keys(player.persistentData).forEach(key => {
                delete player.persistentData[key];
            });

            ctx.source.sendSuccess(Text.of("§aCleared all persistent data"), true);
            return 1;
        })
    );
});
