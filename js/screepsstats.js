
var ScreepsStats = function () {
  if(!Memory.___screeps_stats) {
    Memory.___screeps_stats = {}
  }

  if(!!Game.structures.length > 0) {
    this.username = Game.structures[0].owner.username
  } else if (Game.creeps.length > 0) {
    this.username = Game.creeps[0].owner.username
  } else {
    this.username = false
  }
  this.clean()
}

ScreepsStats.prototype.clean = function () {
  var recorded = Object.keys(Memory.___screeps_stats)
  if(recorded.length > 20) {
    recorded.sort()
    var limit = recorded.length - 20
    for(var i = 0; i < limit; i++) {
      this.removeTick(recorded[i])
    }
  }
}

ScreepsStats.prototype.addStat = function (key, value) {

  // Key is in format 'parent.child.grandchild.greatgrantchild.etc'

  var key_split = key.split('.')

  if(key_split.length == 1) {
    Memory.___screeps_stats[Game.time][key_split[0]] = value
    return
  }

  start = Memory.___screeps_stats[Game.time][key_split[0]]

  var tmp = {}
  for (var i=0,n=key_split.length; i<n; i++){
    if(i == (n-1)) {
      tmp[arr[i]]=value;
    } else {
      tmp[arr[i]]={};
      tmp = tmp[arr[i]];
    }
  }

  _.merge(start = Memory.___screeps_stats[Game.time], tmp)
}

ScreepsStats.prototype.runBuiltinStats = function () {

  this.clean()
  stats = {}
  stats.time = new Date().toISOString()
  stats.tick = Game.time

  stats['cpu'] = {
    'limit': Game.cpu.limit,
    'tickLimit': Game.cpu.tickLimit,
    'bucket': Game.cpu.bucket
  }

  stats['gcl'] = {
    'level': Game.gcl.level,
    'progress': Game.gcl.progress,
    'progressTotal': Game.gcl.progressTotal
  }

  if(!stats['rooms']) {
    stats['rooms'] = {
      'subgroups': true
    }
  }


  for(var roomName in Game.rooms) {
    var room = Game.rooms[roomName]

    if(!stats[roomName]) {
      stats['rooms'][roomName] = {}
    }

    if(!!room.controller) {
      var controller = room.controller

      // Is hostile room? Continue
      if(!controller.my) {
        if(!!controller.owner) { // Owner is set but is not this user.
          if(controller.owner.username != this.username) {
            continue
          }
        }
      }

      // Collect stats
      stats['rooms'][roomName]['level'] = controller.level
      stats['rooms'][roomName]['progress'] = controller.progress

      if(!!controller.upgradeBlocked) {
        stats['rooms'][roomName]['upgradeBlocked'] = controller.upgradeBlocked
      }

      if(!!controller.reservation) {
        stats['rooms'][roomName]['reservation'] = controller.reservation.ticksToEnd
      }

      if(!!controller.ticksToDowngrade) {
        stats['rooms'][roomName]['ticksToDowngrade'] = controller.ticksToDowngrade
      }

      if(controller.level > 0) {

        stats['rooms'][roomName]['energyAvailable'] = room.energyAvailable
        stats['rooms'][roomName]['energyAvailable'] = room.energyCapacityAvailable

        if(room.storage) {
          if(!stats['storage']) {
            stats['storage'] = {
              'subgroups': true
            }
          }

          stats['storage'][room.storage.id] = {}
          stats['storage'][room.storage.id].room = room.name
          stats['storage'][room.storage.id].store = _.sum(room.storage.store)
          stats['storage'][room.storage.id]['resources'] = {}
          for(var resourceType in room.storage.store) {
            stats['storage'][room.storage.id]['resources'][resourceType] = room.storage.store[resourceType]
            stats['storage'][room.storage.id][resourceType] = room.storage.store[resourceType]
          }
        }

        if(room.terminal) {

          if(!stats['terminal']) {
            stats['terminal'] = {
              'subgroups': true
            }
          }

          stats['terminal'][room.terminal.id] = {}
          stats['terminal'][room.terminal.id].room = room.name
          stats['terminal'][room.terminal.id].store = _.sum(room.terminal.store)
          stats['terminal'][room.terminal.id]['resources'] = {}
          for(var resourceType in room.terminal.store) {
            stats['terminal'][room.terminal.id]['resources'][resourceType] = room.terminal.store[resourceType]
            stats['terminal'][room.terminal.id][resourceType] = room.terminal.store[resourceType]
          }
        }
      }
    }

    this.roomExpensive(stats,room)
  }

  if(!stats['spawns']) {
    stats['spawns'] = {
      'subgroups': true
    }
  }

  for(var i in Game.spawns) {
    var spawn = Game.spawns[i]
    stats['spawns'][spawn.name] = {}
    stats['spawns'][spawn.name].room = spawn.room.name
    if(!!spawn.spawning) {
      stats['spawns'][spawn.name].busy = true
      stats['spawns'][spawn.name].remainingTime = spawn.spawning.remainingTime
    } else {
      stats['spawns'][spawn.name].busy = false
      stats['spawns'][spawn.name].remainingTime = 0
    }
  }

  Memory.___screeps_stats[Game.time] = stats
}

ScreepsStats.prototype.roomExpensive = function (stats, room) {

  var roomName = room.name


  // Source Mining

  if(!stats['sources']) {
    stats['sources'] = {
      'subgroups': true
    }
  }

  if(!stats['minerals']) {
    stats['minerals'] = {
      'subgroups': true
    }
  }

  stats['rooms'][roomName].spawnEnergy = 0
  stats['rooms'][roomName].spawnEnergyMax = 0

  stats['rooms'][roomName].mineral = 0
  stats['rooms'][roomName].mineralCapacity = 0



  var sources = room.find(FIND_SOURCES)
  stats['rooms'][roomName]['sources'] = {}
  for(var source_index in sources) {
    var source = sources[source_index]
    stats['sources'][source.id] = {}
    stats['sources'][source.id].room = roomName
    stats['sources'][source.id].energy = source.energy
    stats['sources'][source.id].energyCapacity = source.energyCapacity
    stats['sources'][source.id].ticksToRegeneration = source.ticksToRegeneration

    if(source.energy < source.energyCapacity && source.ticksToRegeneration) {
      var energyHarvested = source.energyCapacity - source.energy
      if(source.ticksToRegeneration < ENERGY_REGEN_TIME) {
        var ticksHarvested = ENERGY_REGEN_TIME - source.ticksToRegeneration
        stats['sources'][source.id].averageHarvest = energyHarvested / ticksHarvested
      }
    } else {
      stats['sources'][source.id].averageHarvest = 0
    }

    stats['rooms'][roomName].energy += source.energy
    stats['rooms'][roomName].energyCapacity += source.energyCapacity
  }

  // Mineral Mining
  var minerals = room.find(FIND_MINERALS)
  stats['rooms'][roomName]['minerals'] = {}
  for(var minerals_index in minerals) {
    var mineral = minerals[minerals_index]
    stats['minerals'][mineral.id] = {}
    stats['minerals'][mineral.id].room = roomName
    stats['minerals'][mineral.id].mineralType = mineral.mineralType
    stats['minerals'][mineral.id].mineralAmount = mineral.mineralAmount
    stats['minerals'][mineral.id].ticksToRegeneration = mineral.ticksToRegeneration

    stats['rooms'][roomName].mineralAmount += mineral.mineralAmount
    stats['rooms'][roomName].mineralType += mineral.mineralType
  }


  // Hostiles in Room
  var hostiles = room.find(FIND_HOSTILE_CREEPS)
  stats['rooms'][roomName]['hostiles'] = {}
  for(var hostile_index in hostiles){
    var hostile = hostiles[hostile_index]
    if(!stats['rooms'][roomName]['hostiles'][hostile.owner.username]) {
      stats['rooms'][roomName]['hostiles'][hostile.owner.username] = 1
    } else {
      stats['rooms'][roomName]['hostiles'][hostile.owner.username]++
    }
  }

  // My Creeps
  stats['rooms'][roomName]['creeps'] = room.find(FIND_MY_CREEPS).length
}

ScreepsStats.prototype.removeTick = function (tick) {

  if(Array.isArray(tick)) {
    for(var index in tick) {
      this.removeTick(tick[index])
    }
    return 'ScreepStats: Processed ' + tick.length + ' ticks'
  }

  if(!!Memory.___screeps_stats[tick]) {
    delete Memory.___screeps_stats[tick]
    return 'ScreepStats: Removed tick ' + tick
  } else {
    return 'ScreepStats: tick ' + tick + ' was not present to remove'
  }
}

ScreepsStats.prototype.getStats = function (json) {
  if(json) {
    return JSON.stringify(Memory.___screeps_stats)
  } else {
    return Memory.__screeps_stats
  }
}

ScreepsStats.prototype.getStatsForTick = function (tick) {
  if(!Memory.__screeps_stats[tick]) {
    return false
  } else {
    return Memory.__screeps_stats[tick]
  }
}

module.exports = ScreepsStats
