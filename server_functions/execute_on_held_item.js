// This script lets us perform actions when a player is holding an item.

let checkCounter = 0

ServerEvents.tick(event => {
  checkCounter++
  
  if (checkCounter >= 20) {
    event.server.players.forEach(player => {
      let mainHandItem = player.getMainHandItem()
      if (mainHandItem.id === 'ae2:matter_cannon') {
        player.tell(Text.red('The Matter Cannon is currently being phased out in favor of Tetra ranged weapons. At a later date, it will be removed. Please find an alternative before this item disappears.'))
      }
    })
    
    checkCounter = 0
  }
})