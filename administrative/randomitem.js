// randomitem.js
// Gives random trophy items to players.

var randomItemPool = {
    'palladium:heart_shaped_herb': 10,
    'minecraft:goat_horn': 15,
    'l530:glowstick': 12,
    'tetra:planar_stabilizer':  5,
    'tetra:forged_bolt': 6,
    'l530:le_fishe_au_chocolat': 8,
    'l530:ricks_scroll': 4,
};

var randomItemTable = (function() {
    var table = [];
    var totalWeight = 0;
    
    for (var key in randomItemPool) {
        var itemSpec = key;
        var weight = randomItemPool[key];
        totalWeight += weight;
        table.push({ 
            itemSpec: itemSpec, 
            weight: totalWeight 
        });
    }
    
    return { 
        table: table, 
        totalWeight: totalWeight 
    };
})();

function getRandomItem() {
    var random = Math.random() * randomItemTable.totalWeight;
    
    for (var i = 0; i < randomItemTable.table.length; i++) {
        var entry = randomItemTable.table[i];
        if (random <= entry.weight) {
            return entry.itemSpec;
        }
    }
    
    // fallback (should never happen with a defined pool)
    var keys = Object.keys(randomItemPool);
    return keys.length > 0 ? keys[0] : 'minecraft:apple';
}

ServerEvents.commandRegistry(function(event) {
    var Commands = event.commands;
    var EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');
    var IntegerArgumentType = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType');
    
    event.register(Commands.literal('randomitem')
        .requires(function(source) { return source.hasPermission(2); })
        .then(Commands.argument('player', EntityArgument.player())
            .then(Commands.argument('count', IntegerArgumentType.integer(1, 64))
                .executes(function(ctx) {
                    var player = EntityArgument.getPlayer(ctx, 'player');
                    var count = IntegerArgumentType.getInteger(ctx, 'count');
                    
                    var givenItems = {};
                    var itemSpec, item, displayName;
                    
                    for (var i = 0; i < count; i++) {
                        itemSpec = getRandomItem();
                        item = Item.of(itemSpec);
                        player.give(item);
                        
                        displayName = item.getHoverName().string;
                        givenItems[displayName] = (givenItems[displayName] || 0) + 1;
                    }
                    
                    var itemsList = "";
                    var isFirst = true;
                    
                    for (var name in givenItems) {
                        if (!isFirst) {
                            itemsList += "§e, ";
                        }
                        itemsList += "§6" + name + "§a x" + givenItems[name];
                        isFirst = false;
                    }
                    
                    player.tell("§aYou received random items: " + itemsList);
                    ctx.source.sendSuccess("§aGave random items to §6" + player.name.string + "§a: " + itemsList, true);
                    
                    return 1;
                })
            )
            .executes(function(ctx) {
                // Default to giving 1 if count not specified
                var player = EntityArgument.getPlayer(ctx, 'player');
                
                var itemSpec = getRandomItem();
                var item = Item.of(itemSpec);
                
                player.give(item);
                
                var displayName = item.getHoverName().string;
                player.tell("§aYou received a random item: §6" + displayName);
                ctx.source.sendSuccess("§aGave random item §6" + displayName + " §ato §6" + player.name.string, true);
                
                return 1;
            })
        )
    );
});
