// location_info_splash.js
// This allows us to play a title when a user is moving to a different location!

ServerEvents.commandRegistry(event => {
    const Commands = event.commands;
    const EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument');
  
    event.register(
      Commands.literal('locinfo')
        .then(
          Commands.argument('target', EntityArgument.player())
            .then(
              Commands.literal('limbo')
                .executes(context => {
                  const player = EntityArgument.getPlayer(context, 'target');
                  console.log(`[Intro Command] Executing Limbo intro sequence for player: ${player.username}`);
                  showLocationTitle(player, 'limbo');
                  return 1;
                })
            )
            .then(
              Commands.literal('caldora')
                .executes(context => {
                  const player = EntityArgument.getPlayer(context, 'target');
                  console.log(`[Intro Command] Executing Caldora intro sequence for player: ${player.username}`);
                  showLocationTitle(player, 'caldora');
                  return 1;
                })
            )
            .then(
              Commands.literal('fire')
                .executes(context => {
                  const player = EntityArgument.getPlayer(context, 'target');
                  console.log(`[Intro Command] Executing Fire intro sequence for player: ${player.username}`);
                  showLocationTitle(player, 'fire');
                  return 1;
                })
            )
        )
    );
});

function showLocationTitle(player, location) {
    switch(location) {
        case 'limbo':
            Utils.server.runCommandSilent(`/title ${player.username} actionbar ["",{"text":"Caldora's hidden twin, locked in geostationary orbit.","color":"gray"}]`);
            Utils.server.runCommandSilent(`/title ${player.username} title ["",{"text":"\ue93e "},{"text":"Limbo","bold":true,"color":"blue"}]`);
            break;
        case 'caldora':
            Utils.server.runCommandSilent(`/title ${player.username} actionbar ["",{"text":"The beating heart of Landfall, welcome to the overworld.","color":"gray"}]`);
            Utils.server.runCommandSilent(`/title ${player.username} title ["",{"text":"\ue93d "},{"text":"Caldora","bold":true,"color":"dark_green"}]`);
            break;
        case 'fire':
            Utils.server.runCommandSilent(`/title ${player.username} actionbar ["",{"text":"We're not sure what, why, or how this is. We just know it's bad.","color":"gray"}]`);
            Utils.server.runCommandSilent(`/title ${player.username} title ["",{"text":"\ue93f "},{"text":"Hell","bold":true,"color":"dark_red"}]`);
            break;
        default:
            console.log(`[Intro Command] Invalid location: ${location}`);
    }
}
