# Screeps Stats

Screeps Stats Collection is a service that ingests statistics and console data from the Screeps
game and saves them in ElasticSearch. This service can be setup on an existing server or can
be provisioned using the supplied vagrant file.


## Features

* Full console output is saved in a quickly searchable database.
* Performance data- such as CPU and Memory usage- is saved and charted over time.
* Provided "screepsstats.js" module can be added to game code in order to collect more statistics.
* Custom statistics can be easily added using screepsstats module.
* Statistics are buffered, reducing needed API calls and ensuring data isn't lost for minor issues (server restarts, internet issues).


## Quick Start with Vagrant

You can run this immediately on your own computer using vagrant.

1. Install [vagrant](https://www.vagrantup.com/).
2. Open terminal to this project.
3. Copy the configuration file (`cp .screeps_settings.dist.yaml .screeps_settings.yaml`) and fill it out.
4. Run `vagrant up` and wait.
6. Open your browser to [http://172.16.0.2/](http://172.16.0.2/).


## Self Hosting (Ubuntu)

### Install

Running the Screps Stats Collector service on a linux server is a little more complicated but far more
robust. This is the recommended setup for long term installations.

ElasticSearch can be installed however you wish, but a provisioning script for ElasticSearch and
Kibana is provided.

1. Download - `wget $(curl -L -s https://api.github.com/repos/screepers/stascreeps-stats/releases/latest | grep tarball_url | head -n 1 | cut -d '"' -f 4) -O screepsstats.tgz`
2. Unpack - `mkdir screepsstats; tar zxvf screepsstats.tgz -C ./screepsstats --strip 1`.
3. Move - `sudo mv screepsstats /opt/screepsstats`.
4. Change Directory - `cd /opt/screepsstats`
5. OPTIONAL: Provision ElasticSearch and Kibana `sudo ./provisioning/provision.sh`.
6. Configure - `cp .screeps_settings.dist.yaml .screeps_settings.yaml` and then edit.
7. Build - `make`
8. Install - `sudo make install`


### Manage Service

If you are using an operating system with SystemD this service will be installed when you run `make install`.
From there it can be managed with the systemctl tool (`systemctl start screepstats.service`).

For servers without systemd the `screepsstatsctl` service manager has been provided. It takes the commands
`start`, `stop`, and `reset`. For security reasons this should be run as root (it will downgrade itself
to it's own user).


## Enhanced Screeps Stats Collection

By default this service will ingest the console and performance data (cpu and memory size).

With the addition of a client side (in game, javascript) module additional statistics, including
custom stats, can be added.

```javascript
var ScreepsStats = require('screepsstats')
global.Stats = new ScreepsStats()

module.exports.loop = function () {

  // Do code stuff!

  // Run Stats Last.
  Stats.runBuiltinStats()
}
```

When the stats collection service picks stats up from the server it will erase them, so as long as the service is
running only a few ticks with of data will be stored. If the stats service fails. Stats will be collected for up
to 20 ticks, at which point the oldest data will be removed.

It's important for the `ScreepsStats` class to get assigned to `global.Stats`, as the stats collection server will
use this class to delete ticks that it has finished processing.


## Enhanced Console Attributes

This module uses the console attribute system defined in the [Screeps Console](https://github.com/screepers/screeps_console)
project. By adding additional tags like `severity`, `group`, and `tick`, developers can sort and filter their console data
to drill down into issue.

You can start with the [ExampleLogger](https://github.com/screepers/screeps_console/blob/master/docs/ExampleLogger.js) in
that project as a replacement for `console.log` to immediately take advantage of this.
