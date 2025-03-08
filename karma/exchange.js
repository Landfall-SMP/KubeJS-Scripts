// Karma Exchange Configuration
const BASE_KARMA_RATE = 250; // Base karma required for 1 cog
const DAILY_EXCHANGE_TRACKING_KEY = 'dailyKarmaExchangeTotal';
const MAX_DAILY_COGS = 16; // Maximum cogs a player can exchange per day

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const IntegerArgumentType = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType');

    event.register(Commands.literal('exchange')
        .executes(ctx => {
            const player = ctx.source.player;
            if (!player) {
                ctx.source.sendFailure("§cThis command can only be executed by a player.");
                return 0;
            }

            const dailyExchangeTotal = getDailyExchangeTotal(ctx.source.server);
            const dynamicRate = calculateDynamicRate(dailyExchangeTotal);
            const dailyPlayerExchanges = getPlayerDailyExchanges(player);
            const currentKarma = player.persistentData.karmaPoints || 0;

            // Rate and exchange information
            player.tell("§e⚖ Karma Exchange");
            player.tell(`§7Current Rate: §f1 cog = §f${dynamicRate} karma`);
            
            // Compact exchange preview
            player.tell("§7Exchange Preview:");
            const previewCogs = [1, 2, 4, 8];
            previewCogs.forEach(cogs => {
                const karmaRequired = cogs * dynamicRate;
                player.tell(`§f${cogs} cog${cogs > 1 ? 's' : ''}: §7${karmaRequired} karma`);
            });

            // Personal status
            player.tell("§7Your Status:");
            player.tell(`§8• Current Karma: §f${currentKarma}`);
            player.tell(`§8• Daily Exchanges: §f${dailyPlayerExchanges}/${MAX_DAILY_COGS} cogs`);

            // Usage hint
            player.tell("§8Tip: Use §f/exchange <amount>§8 to exchange karma for cogs.");

            return 1;
        })
        .then(Commands.argument('amount', IntegerArgumentType.integer(1))
            .executes(ctx => {
                const player = ctx.source.player;
                if (!player) {
                    ctx.source.sendFailure("§cThis command can only be executed by a player.");
                    return 0;
                }

                const cogsRequested = IntegerArgumentType.getInteger(ctx, 'amount');
                const currentKarma = player.persistentData.karmaPoints || 0;

                // Check daily exchange limit
                const dailyPlayerExchanges = getPlayerDailyExchanges(player);
                if (dailyPlayerExchanges + cogsRequested > MAX_DAILY_COGS) {
                    player.tell(`§cYou can only exchange up to ${MAX_DAILY_COGS} cogs per day. You have already exchanged ${dailyPlayerExchanges} cogs today.`);
                    return 0;
                }

                // Calculate dynamic exchange rate
                const dailyExchangeTotal = getDailyExchangeTotal(ctx.source.server);
                const dynamicRate = calculateDynamicRate(dailyExchangeTotal);
                
                // Calculate total karma required
                const karmaRequired = cogsRequested * dynamicRate;

                // Check if player has enough karma
                if (karmaRequired > currentKarma) {
                    player.tell(`§cYou do not have enough karma. You need ${karmaRequired} karma to exchange ${cogsRequested} cogs. You currently have ${currentKarma} karma.`);
                    return 0;
                }

                // Perform the exchange
                player.persistentData.karmaPoints = currentKarma - karmaRequired;
                
                // Give player cogs
                for (let i = 0; i < cogsRequested; i++) {
                    Utils.server.runCommandSilent(`/give ${player.username} numismatics:cog`);
                }

                // Update tracking
                player.persistentData.dailyCogsExchanged = (player.persistentData.dailyCogsExchanged || 0) + cogsRequested;
                updateDailyExchangeTotal(ctx.source.server, karmaRequired);

                player.tell(`§aExchanged ${karmaRequired} karma for ${cogsRequested} cogs.`);
                player.tell(`§7Current exchange rate: ${dynamicRate} karma per cog`);
                player.tell(`§7You have exchanged ${player.persistentData.dailyCogsExchanged}/${MAX_DAILY_COGS} cogs today.`);

                return 1;
            })
        )
    );
});

function calculateDynamicRate(dailyExchangeTotal) {
    const baseRate = BASE_KARMA_RATE;
    const scaleFactor = 1 + (dailyExchangeTotal / 10000);
    
    return Math.ceil(baseRate * scaleFactor);
}

function getDailyExchangeTotal(server) {
    const worldData = server.persistentData;
    const currentTime = Date.now();
    
    // Reset if it's a new day
    if (!worldData[DAILY_EXCHANGE_TRACKING_KEY] || 
        (currentTime - worldData[DAILY_EXCHANGE_TRACKING_KEY].timestamp > 24 * 60 * 60 * 1000)) {
        worldData[DAILY_EXCHANGE_TRACKING_KEY] = {
            total: 0,
            timestamp: currentTime
        };
    }

    return worldData[DAILY_EXCHANGE_TRACKING_KEY].total;
}

function updateDailyExchangeTotal(server, exchangeAmount) {
    const worldData = server.persistentData;
    const currentTime = Date.now();

    // Initialize or reset if needed
    if (!worldData[DAILY_EXCHANGE_TRACKING_KEY] || 
        (currentTime - worldData[DAILY_EXCHANGE_TRACKING_KEY].timestamp > 24 * 60 * 60 * 1000)) {
        worldData[DAILY_EXCHANGE_TRACKING_KEY] = {
            total: 0,
            timestamp: currentTime
        };
    }

    // Update total
    worldData[DAILY_EXCHANGE_TRACKING_KEY].total += exchangeAmount;
}

function getPlayerDailyExchanges(player) {
    const currentTime = Date.now();
    
    // Reset if it's a new day
    if (!player.persistentData.dailyCogsExchangedTimestamp || 
        (currentTime - player.persistentData.dailyCogsExchangedTimestamp > 24 * 60 * 60 * 1000)) {
        player.persistentData.dailyCogsExchanged = 0;
        player.persistentData.dailyCogsExchangedTimestamp = currentTime;
    }

    return player.persistentData.dailyCogsExchanged || 0;
}

// Daily reset event
ServerEvents.tick(event => {
    const server = event.server;
    const currentTime = Date.now();
    const worldData = server.persistentData;

    // Check if 24 hours have passed
    if (worldData[DAILY_EXCHANGE_TRACKING_KEY] && 
        (currentTime - worldData[DAILY_EXCHANGE_TRACKING_KEY].timestamp > 24 * 60 * 60 * 1000)) {
        // Reset the daily exchange total
        worldData[DAILY_EXCHANGE_TRACKING_KEY] = {
            total: 0,
            timestamp: currentTime
        };

        // Optionally, reset all players' daily exchange counts
        server.players.forEach(player => {
            player.persistentData.dailyCogsExchanged = 0;
            player.persistentData.dailyCogsExchangedTimestamp = currentTime;
        });
    }
});
