#!/usr/bin/env python

from datetime import datetime
from elasticsearch import Elasticsearch
import screepsapi
from settings import getSettings
import six
import time

class ScreepsMemoryStats():

    es = Elasticsearch()

    def __init__(self, u=None, p=None, ptr=False):
        self.user = u
        self.password = p
        self.ptr = ptr

    def getScreepsAPI(self):
        if not self.__api:
            settings = getSettings()
            self.__api = screepsapi.API(u=settings['screeps_username'],p=settings['screeps_password'],ptr=settings['screeps_ptr'])
        return self.__api
    __api = False

    def run_forever(self):
        while True:
            self.run()
            time.sleep(3)

    def run(self):
        screeps = self.getScreepsAPI()
        stats = screeps.memory(path='___screeps_stats')
        if 'data' not in stats:
            return False

        # stats[tick][group][subgroup][data]
        # stats[4233][rooms][W43S94] = {}
        date_index = time.strftime("%Y_%d")
        for tick,tickstats in stats['data'].items():
            for group,groupstats in tickstats.items():

                indexname = 'screeps-stats-' + group + '_' + date_index
                if not isinstance(groupstats, dict):
                    continue

                if 'subgroups' in groupstats:
                    for subgroup, statdata in groupstats.items():
                        if subgroup == 'subgroups':
                            continue

                        statdata[group] = subgroup
                        statdata['tick'] = tickstats['tick']
                        statdata['timestamp'] = tickstats['time']
                        res = self.es.index(index=indexname, doc_type="stats", body=statdata)
                        print res
                else:
                    groupstats['tick'] = tickstats['tick']
                    groupstats['timestamp'] = tickstats['time']
                    res = self.es.index(index=indexname, doc_type="stats", body=groupstats)
                    print res

                self.confirm(tick)

    def confirm(self, tick):

        if isinstance(tick, six.string_types):
            tick = int(tick)

        if (isinstance( tick, int)) or (isinstance( tick, long)):
            sconn = self.getScreepsAPI()
            javascript_clear = 'Stats.removeTick(' + str(tick) + ');'
            sconn.console(javascript_clear)


if __name__ == "__main__":
    settings = getSettings()
    screepsconsole = ScreepsMemoryStats(u=settings['screeps_username'], p=settings['screeps_password'], ptr=settings['screeps_ptr'])
    screepsconsole.run_forever()
