/* Voting system, using Votifier for Fabric via Sinytra Connector with this line commented out: https://github.com/Kryeit/Votifier/blob/1.20.1/src/main/java/com/kryeit/votifier/Votifier.java#L116

Votifier config is as follows:

 {
  "host": "0.0.0.0",
  "port": "8192",
  "debug": false,
  "command-after-voting": "/vote add %player%",
  "voting-link": "x"
}
*/

// const
const VOTING_REWARD_KARMA = 50;
const VOTES_FOR_RANDOM_ITEM = 15; // Number of votes required to receive a random item
const votingLinks = [
    "https://minecraft-server-list.com/server/509337/vote",
    "https://topg.org/minecraft-servers/server-669693#vote",
    "https://minecraftservers.org/vote/669897",
    "https://minecraft.buzz/vote/13016",
    "https://minecraft-mp.com/server/339513/vote/"
];

// init player persistentData for vote points and karma if not already set
function initializePlayerData(player) {
    if (!player.persistentData.votePoints) {
        player.persistentData.votePoints = 0;
    }
    if (!player.persistentData.karmaPoints) {
        player.persistentData.karmaPoints = 0;
    }
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    const EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');

    event.register(
        Commands.literal('vote')
            // /vote command for players to view voting links
            .executes(ctx => {
                const player = ctx.source.player;

                if (!player) {
                    ctx.source.sendFailure("§cThis command can only be executed by a player.");
                    return 0;
                }

                // Initialize player data
                initializePlayerData(player);
                
                // Calculate votes until next random item
                const currentVotes = player.persistentData.votePoints;
                const nextMilestone = Math.ceil((currentVotes + 1) / VOTES_FOR_RANDOM_ITEM) * VOTES_FOR_RANDOM_ITEM;
                const votesUntilMilestone = nextMilestone - currentVotes;

                // Display voting links
                player.tell("§e--- §6Vote for the Server §e---");
                votingLinks.forEach(link => {
                    player.tell(`§7- ${link}`);
                });
                player.tell("§e---     Get Rewards!      §e---");
                player.tell(`§6Your Vote Count: §a${currentVotes}`);
                player.tell(`§6Votes until Random Item: §a${votesUntilMilestone}`);

                return 1;
            })

            // Admin: /vote view <player>
            .then(
                Commands.literal('view')
                    .requires(source => source.hasPermission(2)) // Restrict to admins (permission level 2)
                    .then(
                        Commands.argument('target', EntityArgument.player())
                            .executes(ctx => {
                                const target = EntityArgument.getPlayer(ctx, 'target');

                                if (!target) {
                                    ctx.source.sendFailure("§cTarget player not found.");
                                    return 0;
                                }

                                // Initialize target player data
                                initializePlayerData(target);

                                const votePoints = target.persistentData.votePoints;
                                
                                // Calculate votes until next random item
                                const nextMilestone = Math.ceil((votePoints + 1) / VOTES_FOR_RANDOM_ITEM) * VOTES_FOR_RANDOM_ITEM;
                                const votesUntilMilestone = nextMilestone - votePoints;

                                ctx.source.sendSuccess(`§e${target.name.string} has voted §a${votePoints} §etimes. §6(${votesUntilMilestone} votes until next random item)`, true);
                                return 1;
                            })
                    )
            )

            // Admin: /vote add <player>
            .then(
                Commands.literal('add')
                    .requires(source => source.hasPermission(2)) // Restrict to admins
                    .then(
                        Commands.argument('target', EntityArgument.player())
                            .executes(ctx => {
                                const target = EntityArgument.getPlayer(ctx, 'target');
                                const server = ctx.source.server;

                                if (!target) {
                                    ctx.source.sendFailure("§cTarget player not found.");
                                    return 0;
                                }

                                // init target player data
                                initializePlayerData(target);

                                // Add vote point and karma bonus
                                target.persistentData.votePoints += 1;
                                target.persistentData.karmaPoints += VOTING_REWARD_KARMA;

                                // Get the new vote count
                                const newVoteCount = target.persistentData.votePoints;

                                
                                // Check if player has reached a multiple of 10 votes
                                if (newVoteCount % VOTES_FOR_RANDOM_ITEM === 0) {
                                    // Run the randomitem command for this player
                                    server.runCommandSilent(`randomitem ${target.name.string}`);
                                    
                                    // Extra notification for the milestone
                                    target.tell("§d⭐ §6Voting Milestone Reached! §d⭐");
                                }

                                // tell player about karma
                                target.tell(`§eDivinity has granted you §a1 Vote Point §eand §a${VOTING_REWARD_KARMA} Karma §efor voting!`);

                                // respond to executor
                                ctx.source.sendSuccess(`§eAdded §a1 Vote Point §eand §a${VOTING_REWARD_KARMA} Karma §eto ${target.name.string}.`, true);

                                return 1;
                            })
                    )
            )
    );
});
