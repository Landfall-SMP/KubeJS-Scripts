ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const StringArgumentType = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')

    event.register(
        Commands.literal('name')
            .then(
                Commands.argument('name', StringArgumentType.string())
                    .executes(context => {
                        const player = context.source.player;
                        const newName = StringArgumentType.getString(context, 'name');
                        
                        // Check if player is banned from using nicknames
                        if (player.persistentData.nickban) {
                            player.tell('§c⚠ You are banned from changing your name.');
			    player.tell('§7This is usually the result of nickname abuse. Please open a ticket in the Discord to get help changing your name and appeal the ban.');
                            console.log(`[Name Command] Player ${player.username} attempted to change name but is nickbanned`);
                            return 0;
                        }
                        
                        console.log(`[Name Command] Player ${player.username} is attempting to set name to: "${newName}"`);
                        setPlayerName(player, newName);
                        return 1;
                    })
            )
    );
});

function setPlayerName(player, name) {
    // Before doing anything, double check the nickban status
    if (player.persistentData.nickban) {
        player.tell('§c⚠ You are banned from changing your name.');
	player.tell('§7This is usually the result of nickname abuse. Please open a ticket in the Discord to get help changing your name and appeal the ban.');
        console.log(`[Set Name] Name change blocked for nickbanned player: ${player.username}`);
        return;
    }

    // Define name validation regex
    const nameFormat = /^[A-Z][a-z]+(?: [A-Z]\.?)? [A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/;

    // Define word blacklist
    const wordBlacklist = [
        'admin', 
        'moderator', 
        'staff', 
        'owner', 
        'knight', 
        'mister', 
        'king', 
        'sir', 
        'meka'
    ];

    console.log(`[Set Name] Validating name "${name}" for player: ${player.username}`);

    // Check for blacklisted words (case-insensitive)
    const containsBlacklistedWord = wordBlacklist.some(word => 
        name.toLowerCase().includes(word.toLowerCase())
    );

    if (containsBlacklistedWord) {
        player.tell(`§cThat doesn't look like a name... Please choose a plausible name to engage with the canon. If you are being wrongfully flagged for a valid name, contact a member of staff.`);
        console.log(`[Set Name] Name "${name}" contains blacklisted word for player: ${player.username}`);
        return;
    }

    if (true) {
//    if (nameFormat.test(name)) {
        console.log(`[Set Name] Name "${name}" is valid for player: ${player.username}`);

        Utils.server.runCommandSilent(`fakename set ${player.username} "${name}"`);
        console.log(`[Set Name] Applied fakename set for player: ${player.username} with name: "${name}"`);

        player.tell(`§8Your name is now §7§l${name}§8.`)

        if (player.persistentData.awaitingNameInput) {
            delete player.persistentData.awaitingNameInput;
            console.log(`[Set Name] Cleared 'awaitingNameInput' for player: ${player.username}`);
            proceedToFinalStage(player);
        }
    // } else {
    //     player.tell('§cInvalid name format. Please use a proper format (e.g., "John Smith").');
    //     player.tell('§c- Use quotes around the name, e.x.: /name "Jane Doe"');    
    //     player.tell('§c- Capitalize only the first letters, for "Jerry Doe", only J and D.');
    //     console.log(`[Set Name] Name "${name}" failed validation for player: ${player.username}`);
    // }
}

function proceedToFinalStage(player) {
    const server = player.server;
    console.log(`[Final Stage] Proceeding for player: ${player.username}`);

    playSoundAndMessage(player, 'l530:sound5',
        "§6The Divine Entity: §7Good, that name suits you. I know you don't remember, but trust me… The burden of a thousand years weighs heavy, and you shall carry it with pride. This is where I leave you to your... heh, gods. Choose wisely and worship well.");

    server.scheduleInTicks(15 * 20, () => {
    Utils.server.runCommandSilent(`/execute in landfall:limbo as ${player.username} facing -10000 0 90 run tp 28 -34 35`);
        Utils.server.runCommandSilent(`effect clear ${player.username}`);
        console.log(`[Final Stage] Teleported ${player.username} to final stage.`);
    });
}

function playSoundAndMessage(player, sound, message) {
    Utils.server.runCommandSilent(`execute as ${player.username} at @s run playsound ${sound} master @s`);
    console.log(`[Sound Playback] Played sound "${sound}" for player: ${player.username}`);
    player.tell(message);
    console.log(`[Message Sent] Message sent to player: ${player.username}`);
}
