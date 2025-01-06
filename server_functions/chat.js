// This script helps to highlight valid character names on the server without coloring badges added via a resourcepack font

PlayerEvents.chat((event) => {
    let { player, message, server } = event;

    // display name to plain string
    const rawDisplayName = player.displayName.getString 
        ? player.displayName.getString() 
        : String(player.displayName);

    // Regex to split prefix and name
    const match = rawDisplayName.match(/^([^\w\s]\s)?(.*)$/);
    const unicodePrefix = match && match[1] ? match[1] : ""; // Unicode prefix/badge, if present
    const restOfName = match && match[2] ? match[2] : rawDisplayName;

    // Regex to validate name
    const nameFormat = /^[^\w\s]?\s?[A-Z][a-z]+(?: [A-Z]\.)? [A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s*§[a-z]*$/;
    const isValidName = nameFormat.test(restOfName);

    // Construct message parts
    const prefixComponent = Text.white(unicodePrefix); // badge stays white
    const nameComponent = isValidName 
        ? Text.yellow(restOfName) 
        : Text.darkGray(restOfName); // color name based on validity

    // Output the chat message
    server.tell([
        prefixComponent,
        nameComponent,
        " ",
        Text.gray("»"),
        " ",
        Text.white(message)
    ]);

    // stop original event to send custom output
    event.cancel();
});