ServerEvents.recipes(event => {
    // Remove specific crafting recipes
    event.remove({ output: 'immersive_aircraft:gyrodyne' });
    event.remove({ output: 'immersive_aircraft:nether_engine' });
    event.remove({ output: 'mekanism:atomic_disassembler' });
    event.remove({ output: 'mekanism:digital_miner' });
    event.remove({ output: 'mekanism:portable_teleporter' });
    event.remove({ output: 'mekanism:teleporter' });
    event.remove({ output: 'mekanism:upgrade_anchor' });
    event.remove({ output: 'mekanism:flamethrower' });
    event.remove({ output: 'mekanism:electric_bow' });
    event.remove({ output: 'mekanism:canteen' });
    event.remove({ output: 'ae2:matter_cannon' });

    // Add a shapeless recipe for Firework Rockets (4x output)
    event.shapeless(
        Item.of('minecraft:firework_rocket', 4), // Output: 4x Firework Rocket
        [ 'l530:refined_fuel', 'minecraft:paper' ] // Ingredients
    ).id('custom:firework_rocket'); // Assign a custom ID to the recipe
});
