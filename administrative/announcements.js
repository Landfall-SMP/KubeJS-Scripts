// Simple Announcement System

// Constants
const ANNOUNCEMENT_INTERVAL = 18000; // (in ticks)

// Common formatting
const PREFIX = "§e[§6!§e]"; // Gold exclamation mark in yellow brackets
const PRIMARY_COLOR = "§6";  // Gold
const TEXT_COLOR = "§a";     // Green
const HIGHLIGHT_COLOR = "§e"; // Yellow

// Simple array of messages to broadcast
const messages = [
    `${PREFIX} ${PRIMARY_COLOR}Lore: ${TEXT_COLOR}Discover the rich history of our world at${HIGHLIGHT_COLOR} https://landfall.world`,
    `${PREFIX} ${PRIMARY_COLOR}Voting: ${TEXT_COLOR}Have you voted today? Run ${HIGHLIGHT_COLOR}/vote ${TEXT_COLOR}to support the server and earn rewards!`,
    `${PREFIX} ${PRIMARY_COLOR}Rules: ${TEXT_COLOR}Remember to be respectful to all players! We have zero tolerance for toxicity.`,
    `${PREFIX} ${PRIMARY_COLOR}Donate: ${TEXT_COLOR}Enjoy our server? Consider supporting us at${HIGHLIGHT_COLOR} https://store.landfall.world`,
    `${PREFIX} ${PRIMARY_COLOR}Tip: ${TEXT_COLOR}Form alliances with other players to establish stronger nations!`,
    `${PREFIX} ${PRIMARY_COLOR}Voting: ${TEXT_COLOR}Vote for great rewards including karma and random items!`,
    `${PREFIX} ${PRIMARY_COLOR}Rules: ${TEXT_COLOR}Even though there are no claims, you may not begin to raid people without declaring war! Read more at${HIGHLIGHT_COLOR} https://landfall.world`,
    `${PREFIX} ${PRIMARY_COLOR}Tip: ${TEXT_COLOR}Use ${HIGHLIGHT_COLOR}/homes ${TEXT_COLOR}to easily get back to your place!`,
    `${PREFIX} ${PRIMARY_COLOR}Tip: ${TEXT_COLOR}Check out ${HIGHLIGHT_COLOR}/karma info ${TEXT_COLOR}to get started with the Karma system!`,
    `${PREFIX} ${PRIMARY_COLOR}Lore: ${TEXT_COLOR}Read about our expansive lore at${HIGHLIGHT_COLOR} https://landfall.world`,
    `${PREFIX} ${PRIMARY_COLOR}Donate: ${TEXT_COLOR}Support the server at${HIGHLIGHT_COLOR} https://store.landfall.world`,
    `${PREFIX} ${PRIMARY_COLOR}Tip: ${TEXT_COLOR}Looking for a new place to settle? Use ${HIGHLIGHT_COLOR}/rtp${TEXT_COLOR}.`,
    `${PREFIX} ${PRIMARY_COLOR}Tip: ${TEXT_COLOR}Airplanes require a special ${HIGHLIGHT_COLOR}refined fuel${TEXT_COLOR} to operate. Many places sell it, too!`
];

// Index to track the current message
let currentMessageIndex = 0;

// Store the last tick we checked to ensure we don't miss anything
let lastAnnouncementTick = 0;

// Log when the script is loaded
console.info("Announcement system loaded successfully!");

// Register the tick event with alternate approach
ServerEvents.tick(event => {
    if (!event.server) return;
    
    const currentTick = event.server.tickCount;
    var message = ""
    
    // Check if we've moved into a new interval period
    if (Math.floor(currentTick / ANNOUNCEMENT_INTERVAL) > Math.floor(lastAnnouncementTick / ANNOUNCEMENT_INTERVAL)) {
        console.info(`Announcement interval reached at tick ${currentTick}`);
        
        try {
            // Get the current message and advance the index
            message = messages[currentMessageIndex];
            currentMessageIndex = (currentMessageIndex + 1) % messages.length;
            
            // Send the message to all players
            event.server.players.forEach(player => {
                try {
                    player.tell(message);
                } catch (e) {
                    console.error(`Error sending message to player ${player.name}: ${e}`);
                }
            });
            
            // Log that a message was sent
            console.info(`Successfully sent announcement: ${message}`);
        } catch (e) {
            console.error(`Error in announcement broadcast: ${e}`);
        }
    }
    
    // Update the last tick we checked
    lastAnnouncementTick = currentTick;
});

// Register a command to test the announcement system
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    
    event.register(
        Commands.literal('testannouncement')
            .requires(source => source.hasPermission(2))  // Requires op permission
            .executes(ctx => {
                const server = ctx.source.server;
                
                // Get a random message
                const randomIndex = Math.floor(Math.random() * messages.length);
                const message = messages[randomIndex];
                
                try {
                    // Send to all players
                    server.players.forEach(p => {
                        p.tell(message);
                    });
                    
                    // Confirm to the command executor
                    ctx.source.sendSuccess("Sent a test announcement to all players.", true);
                    console.info(`Test announcement sent: ${message}`);
                } catch (e) {
                    console.error(`Error in test announcement: ${e}`);
                    ctx.source.sendFailure(`Error sending announcement: ${e}`);
                }
                
                return 1;
            })
    );
});

// Register a command to check announcement status
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    
    event.register(
        Commands.literal('announcementstatus')
            .requires(source => source.hasPermission(2))  // Requires op permission
            .executes(ctx => {
                const server = ctx.source.server;
                const currentTick = server.tickCount;
                
                // Calculate next announcement tick
                const nextInterval = Math.ceil(currentTick / ANNOUNCEMENT_INTERVAL) * ANNOUNCEMENT_INTERVAL;
                const ticksRemaining = nextInterval - currentTick;
                
                // Report current status
                ctx.source.sendSuccess(`Current server tick: ${currentTick}`, false);
                ctx.source.sendSuccess(`Last announcement check: ${lastAnnouncementTick}`, false);
                ctx.source.sendSuccess(`Next announcement at tick: ${nextInterval}`, false);
                ctx.source.sendSuccess(`Next announcement in: ${ticksRemaining} ticks`, false);
                ctx.source.sendSuccess(`Current message index: ${currentMessageIndex} of ${messages.length}`, false);
                
                return 1;
            })
    );
});
