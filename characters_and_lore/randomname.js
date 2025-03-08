// Handles nickname assignment with randomization

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');

    event.register(
        Commands.literal('randomnack')
            .requires(source => source.hasPermission(2)) // Requires OP permission
            .then(
                Commands.argument('player', EntityArgument.player())
                    .executes(context => {
                        const targetPlayer = EntityArgument.getPlayer(context, 'player');
                        
                        // Check if target player is banned from nicknames
                        if (targetPlayer.persistentData.nickban) {
                            context.source.sendFailure(`§c⚠ ${targetPlayer.name.string} is banned from having a nickname.`);
                            console.log(`[RandomNick] Command blocked for nickbanned player: ${targetPlayer.username}`);
                            return 0;
                        }
                        
                        // Generate a random medieval name
                        const randomName = generateRandomMedievalName();
                        console.log(`[RandomNick] Assigning random name "${randomName}" to player: ${targetPlayer.username}`);
                        
                        // Apply the name
                        Utils.server.runCommandSilent(`fakename set ${targetPlayer.username} "${randomName}"`);
                        
                        // Notify source and target
                        context.source.sendSuccess(`§8Assigned random name §7§l${randomName}§8 to ${targetPlayer.name.string}.`, true);
                        targetPlayer.tell(`§8Your name has been set to §7§l${randomName}§8.`);
                        
                        return 1;
                    })
            )
            .executes(context => {
                // Self-version for non-targeted command
                if (!context.source.player) {
                    context.source.sendFailure("This command can only be executed by a player when no target is specified");
                    return 0;
                }
                
                const player = context.source.player;
                
                // Check if player is banned from nicknames
                if (player.persistentData.nickban) {
                    context.source.sendFailure(`§c⚠ You are banned from changing your name.`);
                    console.log(`[RandomNick] Command blocked for nickbanned player: ${player.username}`);
                    return 0;
                }
                
                // Generate a random medieval name
                const randomName = generateRandomMedievalName();
                console.log(`[RandomNick] Player ${player.username} self-assigning random name: "${randomName}"`);
                
                // Apply the name
                Utils.server.runCommandSilent(`fakename set ${player.username} "${randomName}"`);
                
                // Notify the player
                player.tell(`§8Your name is now §7§l${randomName}§8.`);
                
                return 1;
            })
    );
});

function generateRandomMedievalName() {
    // Arrays of medieval-appropriate first names
    const maleFirstNames = [
        "William", "John", "Robert", "Richard", "Thomas", "Henry", "Edward", "Walter", "Hugh", "Simon",
        "Geoffrey", "Adam", "Stephen", "Peter", "Nicholas", "Roger", "Ralph", "Bartholomew", "Matthew", "Martin",
        "Gregory", "Edmund", "Gilbert", "Godfrey", "Phillip", "Roland", "Baldwin", "Alan", "Miles", "Conrad",
        "Reynold", "Alfred", "Ambrose", "Bernard", "Cedric", "Edwin", "Giles", "Harold", "Jasper", "Leofric"
    ];
    
    const femaleFirstNames = [
        "Agnes", "Alice", "Beatrice", "Catherine", "Eleanor", "Emma", "Isabel", "Joan", "Margaret", "Matilda",
        "Mary", "Avice", "Cecily", "Edith", "Elizabeth", "Juliana", "Lucy", "Mabel", "Rose", "Sarah",
        "Adela", "Agatha", "Amice", "Blanche", "Christina", "Constance", "Elinor", "Felicia", "Gisela", "Hawise",
        "Ida", "Isolda", "Joanna", "Lettice", "Maud", "Muriel", "Philippa", "Sybilla", "Thomasina", "Winifred"
    ];
    
    // Array of medieval-appropriate surnames
    const surnames = [
        "Smith", "Baker", "Miller", "Cooper", "Fletcher", "Tanner", "Taylor", "Wright", "Weaver", "Thatcher",
        "Carpenter", "Shepherd", "Fisher", "Fowler", "Hunter", "Potter", "Slater", "Tanner", "Brewer", "Cook",
        "Archer", "Carter", "Coleman", "Dyer", "Fuller", "Glover", "Hayward", "Mason", "Sawyer", "Waterman",
        "Ashman", "Bowman", "Bridges", "Chamberlain", "Farmer", "Forester", "Granger", "Hooper", "Palmer", "Ryder",
        "Brown", "White", "Black", "Green", "Grey", "Reed", "Stone", "Hill", "Wood", "Field",
        "Attwood", "Brook", "Croft", "Dale", "Forest", "Grove", "Marsh", "Moore", "Pond", "Rivers"
    ];
    
    // Get random indexes for first and last name
    const useFemaleName = Math.random() > 0.5;
    const firstNames = useFemaleName ? femaleFirstNames : maleFirstNames;
    
    const firstNameIndex = Math.floor(Math.random() * firstNames.length);
    const surnameIndex = Math.floor(Math.random() * surnames.length);
    
    // Combine and return
    return `${firstNames[firstNameIndex]} ${surnames[surnameIndex]}`;
}
