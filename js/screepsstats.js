var ScreepsStats = function () {
  if(!Memory.___screeps_stats) {
    Memory.___screeps_stats = {}
  }
  this.username = _.get(
    _.find(Game.structures,(s) => true),'owner.username',
    _.get(_.find(Game.creeps,(s) => true),'owner.username')
  ) || false
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

  var start = Memory.___screeps_stats[Game.time][key_split[0]]

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
  var stats = {
    time: new Date().toISOString(),
    tick: Game.time,
    cpu: {
      limit: Game.cpu.limit,
      tickLimit: Game.cpu.tickLimit,
      bucket: Game.cpu.bucket
    },
    gcl: {
     level: Game.gcl.level,
     progress: Game.gcl.progress,
     progressTotal: Game.gcl.progressTotal
    }
  }

  _.defaults(stats, {
    rooms: {
      subgroups: true
    }
  })

  _.forEach(Game.rooms,(room) => {

    if(!stats[room.name]) {
      stats.rooms[room.name] = {}
    }

    if (_.isEmpty(room.controller)) { return }
    var controller = room.controller

    // Is hostile room? Continue
    if(!controller.my) {
      if(!!controller.owner) { // Owner is set but is not this user.
        if(controller.owner.username != this.username) {
          return
        }
      }
    }

    // Controller
    _.merge(stats.rooms[room.name], {
      level: controller.level,
      progress: controller.progress,
      upgradeBlocked: controller.upgradeBlocked,
      reservation: _.get(controller,'reservation.ticksToEnd'),
      ticksToDowngrade: controller.ticksToDowngrade
    })

    if(controller.level > 0) {

      // Room
      _.merge(stats.rooms[room.name],{
        energyAvailable: room.energyAvailable,
        energyCapacityAvailable: room.energyCapacityAvailable,
      })

      // Storage
      if(room.storage) {
        _.defaults(stats, {
          storage: {
            subgroups: true
          }
        })
        stats.storage[room.storage.id] = {
          room: room.name,
          store: _.sum(room.storage.store),
          resources: {}
        }
        for(var resourceType in room.storage.store) {
          stats.storage[room.storage.id].resources[resourceType] = room.storage.store[resourceType]
          stats.storage[room.storage.id][resourceType] = room.storage.store[resourceType]
        }
      }

      // Terminals
      if(room.terminal) {
        _.defaults(stats, {
          terminal: {
            subgroups: true
          }
        })
        stats.terminal[room.terminal.id] = {
          room: room.name,
          store: _.sum(room.terminal.store),
          resources: {}
        }
        for(var resourceType in room.terminal.store) {
          stats.terminal[room.terminal.id].resources[resourceType] = room.terminal.store[resourceType]
          stats.terminal[room.terminal.id][resourceType] = room.terminal.store[resourceType]
        }
      }

    }

    this.roomExpensive(stats,room)
  })

  // Spawns
  _.defaults(stats, {
    spawns: {
      subgroups: true
    }
  })
  _.forEach(Game.spawns, function(spawn) {
    stats.spawns[spawn.name] = {
      room: spawn.room.name,
      busy: !!spawn.spawning,
      remainingTime: _.get(spawn,'spawning.remainingTime',0)
    }
  })

  Memory.___screeps_stats[Game.time] = stats
}

ScreepsStats.prototype.roomExpensive = function (stats, room) {

  // Source Mining
  _.defaults(stats, {
    sources: {
      subgroups: true
    },
    minerals: {
      subgroups: true
    }
  })

  stats.rooms[room.name].sources = {}
  var sources = room.find(FIND_SOURCES)

  _.forEach(sources,(source) => {
    stats.sources[source.id] = {
      room: room.name,
      energy: source.energy,
      energyCapacity: source.energyCapacity,
      ticksToRegeneration: source.ticksToRegeneration
    }
    if(source.energy < source.energyCapacity && source.ticksToRegeneration) {
      var energyHarvested = source.energyCapacity - source.energy
      if(source.ticksToRegeneration < ENERGY_REGEN_TIME) {
        var ticksHarvested = ENERGY_REGEN_TIME - source.ticksToRegeneration
        stats.sources[source.id].averageHarvest = energyHarvested / ticksHarvested
      }
    } else {
      stats.sources[source.id].averageHarvest = 0
    }

    stats.rooms[room.name].energy += source.energy
    stats.rooms[room.name].energyCapacity += source.energyCapacity
  })

  // Mineral Mining
  var minerals = room.find(FIND_MINERALS)
  stats.rooms[room.name].minerals = {}
  _.forEach(minerals,(mineral) => {
    stats.minerals[mineral.id] = {
      room: room.name,
      mineralType: mineral.mineralType,
      mineralAmount: mineral.mineralAmount,
      ticksToRegeneration: mineral.ticksToRegeneration
    }
    stats.rooms[room.name].mineralAmount += mineral.mineralAmount
    stats.rooms[room.name].mineralType += mineral.mineralType
  })

  // Hostiles in Room
  var hostiles = room.find(FIND_HOSTILE_CREEPS)
  stats.rooms[room.name].hostiles = {}
  _.forEach(hostiles,(hostile) => {
    if(!stats.rooms[room.name].hostiles[hostile.owner.username]) {
      stats.rooms[room.name].hostiles[hostile.owner.username] = 1
    } else {
      stats.rooms[room.name].hostiles[hostile.owner.username]++
    }
  })

  // My Creeps
  stats.rooms[room.name]['creeps'] = room.find(FIND_MY_CREEPS).length
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
