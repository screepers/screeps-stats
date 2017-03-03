var ScreepsStats = function () {
  if (!Memory.___screeps_stats) {
    Memory.___screeps_stats = {}
  }
  this.username = _.get(
    _.find(Game.structures, (s) => true), 'owner.username',
    _.get(_.find(Game.creeps, (s) => true), 'owner.username')
  ) || false
  this.clean()
}

ScreepsStats.prototype.limit = 7

ScreepsStats.prototype.clean = function () {
  var recorded = Object.keys(Memory.___screeps_stats)
  if (recorded.length > this.limit) {
    recorded.sort()
    var limit = recorded.length - this.limit
    for (var i = 0; i < limit; i++) {
      this.removeTick(recorded[i])
    }
  }
}

ScreepsStats.prototype.addStat = function (key, value, subgroups = false) {
  if(!Memory.___screeps_stats[Game.time]) {
    Memory.___screeps_stats[Game.time] = {}
  }

  _.set(Memory.___screeps_stats[Game.time], key, value)
  if(subgroups) {
    var keySplit = key.split('.')
    Memory.___screeps_stats[Game.time][keySplit[0]]['subgroups'] = true
  }
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
    },
    market : {
      'credits': Game.market.credits,
      'orders': Game.market.orders.length
    }
  }

  _.defaults(stats, {
    rooms: {
      subgroups: true
    }
  })

  _.forEach(Game.rooms, (room) => {

    if (!stats[room.name]) {
      stats.rooms[room.name] = {}
    }

    if (_.isEmpty(room.controller)) {
      return
    }
    var controller = room.controller

    // Is hostile room? Continue
    if (!controller.my) {
      if (!!controller.owner) { // Owner is set but is not this user.
        if (controller.owner.username != this.username) {
          return
        }
      } else {
        return
      }
    }

    // Controller
    _.merge(stats.rooms[room.name], {
      level: controller.level,
      progress: controller.progress,
      upgradeBlocked: controller.upgradeBlocked,
      reservation: _.get(controller, 'reservation.ticksToEnd'),
      ticksToDowngrade: controller.ticksToDowngrade
    })

    if (controller.level > 0) {

      // Room
      _.merge(stats.rooms[room.name], {
        energyAvailable: room.energyAvailable,
        energyCapacityAvailable: room.energyCapacityAvailable,
      })

      // Storage
      if (room.storage) {
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
        for (var resourceType in room.storage.store) {
          stats.storage[room.storage.id].resources[resourceType] = room.storage.store[resourceType]
          stats.storage[room.storage.id][resourceType] = room.storage.store[resourceType]
        }
      }

      // Terminals
      if (room.terminal) {
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
        for (var resourceType in room.terminal.store) {
          stats.terminal[room.terminal.id].resources[resourceType] = room.terminal.store[resourceType]
          stats.terminal[room.terminal.id][resourceType] = room.terminal.store[resourceType]
        }
      }

    }

    if(!!controller.my && Game.time % 10 == 0) {
      this.roomExpensive(stats, room)
    }
  })

  // Spawns
  _.defaults(stats, {
    spawns: {
      subgroups: true
    }
  })
  _.forEach(Game.spawns, function (spawn) {
    stats.spawns[spawn.name] = {
      room: spawn.room.name,
      busy: !!spawn.spawning,
      remainingTime: _.get(spawn, 'spawning.remainingTime', 0)
    }
  })

  if(!Memory.___screeps_stats[Game.time]) {
    Memory.___screeps_stats[Game.time] = stats
  } else {
    _.merge(Memory.___screeps_stats[Game.time], stats)
  }
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

  _.forEach(sources, (source) => {
    stats.sources[source.id] = {
      room: room.name,
      energy: source.energy,
      energyCapacity: source.energyCapacity,
      ticksToRegeneration: source.ticksToRegeneration
    }
    if (source.energy < source.energyCapacity && source.ticksToRegeneration) {
      var energyHarvested = source.energyCapacity - source.energy
      if (source.ticksToRegeneration < ENERGY_REGEN_TIME) {
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
  _.forEach(minerals, (mineral) => {
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
  _.forEach(hostiles, (hostile) => {
    if (!stats.rooms[room.name].hostiles[hostile.owner.username]) {
      stats.rooms[room.name].hostiles[hostile.owner.username] = 1
    } else {
      stats.rooms[room.name].hostiles[hostile.owner.username]++
    }
  })

  // My Creeps
  stats.rooms[room.name]['creeps'] = room.find(FIND_MY_CREEPS).length
}

ScreepsStats.prototype.removeTick = function (tick) {

  if (Array.isArray(tick)) {
    for (var index in tick) {
      this.removeTick(tick[index])
    }
    return 'ScreepStats: Processed ' + tick.length + ' ticks'
  }

  if (!!Memory.___screeps_stats[tick]) {
    delete Memory.___screeps_stats[tick]
    return 'ScreepStats: Removed tick ' + tick
  } else {
    return 'ScreepStats: tick ' + tick + ' was not present to remove'
  }
}

ScreepsStats.prototype.getStats = function (json) {
  if (json) {
    return JSON.stringify(Memory.___screeps_stats)
  } else {
    return Memory.___screeps_stats
  }
}

ScreepsStats.prototype.getStatsForTick = function (tick) {
  if (!Memory.___screeps_stats[tick]) {
    return false
  } else {
    return Memory.___screeps_stats[tick]
  }
}

ScreepsStats.prototype.manageSegments = function (allowedSegments=false) {
  if(!allowedSegments || allowedSegments.length <= 0 ) {
    return
  }
  if(!Memory.___screeps_stats[Game.time]) {
    return
  }
  try {
    var current_data = _.values(Memory.___screeps_stats).reduce(function(acc, val){return _.unique(acc.concat(_.values(val)))}, [])
    var unused_segments = _.filter(allowedSegments, function(id){
      return current_data.indexOf(id) < 0
    })
    var segid = unused_segments[0]
    var json = JSON.stringify(Memory.___screeps_stats[Game.time])

    var maxmemory = 100*1024

    var needed_segments = Math.ceil(json.length/maxmemory)
    if(unused_segments.length < needed_segments) {
      return
    }

    var ids = []
    for(var i = 0; i<needed_segments; i++) {
      var segid = unused_segments.pop()
      ids.push(segid)
      var start = i * maxmemory
      var end = start + maxmemory // will end *one before* this value
      var chunk = json.slice(start, end)
      RawMemory.segments[segid] = chunk
    }

    Memory.___screeps_stats[Game.time] = ids
  } catch (err) {
    throw err
  }
}

module.exports = ScreepsStats
