// In the absence of a Forge implementation of Bluemap player hiding, Landfall created this fairly simple script.

const BlueMapAPI = Java.loadClass('de.bluecolored.bluemap.api.BlueMapAPI');

// toggle visibility
function togglePlayerVisibility(player) {
    const apiInstance = BlueMapAPI.getInstance();
    if (!apiInstance.isPresent()) {
        player.tell("§cERR: BlueMapAPI is not initialized.");
        return;
    }

    const playerUUID = player.uuid.toString();
    let blueMapWebApp, currentVisibility, newVisibility, visibilityText;

    apiInstance.ifPresent(api => {
        try {
            blueMapWebApp = api.getWebApp();
            if (!blueMapWebApp) {
                player.tell("§cERR: WebApp is not accessible.");
                return;
            }

            // get/toggle
            currentVisibility = blueMapWebApp.getPlayerVisibility(playerUUID);
            newVisibility = !currentVisibility;
            visibilityText = newVisibility ? '§aon' : '§coff';
            blueMapWebApp.setPlayerVisibility(playerUUID, newVisibility);

            player.tell(`§eToggled visibility to: ${visibilityText}`);
        } catch (error) {
            player.tell("§cERR: Error while toggling visibility.");
        }
    });
}

// set player visibility
function setPlayerVisibility(player, visible) {
    const apiInstance = BlueMapAPI.getInstance();
    if (!apiInstance.isPresent()) {
        player.tell("§cERR: BlueMapAPI is not initialized.");
        return;
    }

    const playerUUID = player.uuid.toString();
    let blueMapWebApp, visibilityText;

    apiInstance.ifPresent(api => {
        try {
            blueMapWebApp = api.getWebApp();
            if (!blueMapWebApp) {
                player.tell("§cERR: WebApp is not accessible.");
                return;
            }

            blueMapWebApp.setPlayerVisibility(playerUUID, visible);
            visibilityText = visible ? '§aon' : '§coff';

            player.tell(`§eVisibility set to: ${visibilityText}`);
        } catch (error) {
            player.tell(`§cERR: ${error}`);
        }
    });
}

// Commands :)
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(Commands.literal('map')
        .then(Commands.literal('toggle')
            .executes(ctx => {
                const player = ctx.source.player;
                togglePlayerVisibility(player);
                return 1;
            })
        )
        .then(Commands.literal('show')
            .executes(ctx => {
                const player = ctx.source.player;
                setPlayerVisibility(player, true);
                return 1;
            })
        )
        .then(Commands.literal('hide')
            .executes(ctx => {
                const player = ctx.source.player;
                setPlayerVisibility(player, false);
                return 1;
            })
        )
    );
});
