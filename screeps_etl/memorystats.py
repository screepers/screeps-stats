#!/usr/bin/env python

from datetime import datetime
from elasticsearch import Elasticsearch
import json
import screepsapi
from settings import getSettings
import six
import time
import os

class ScreepsMemoryStats():

    ELASTICSEARCH_HOST = os.environ['ELASTICSEARCH_PORT_9200_TCP_ADDR'] or 'localhost'
    es = Elasticsearch([ELASTICSEARCH_HOST])

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
        confirm_queue =[]
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
                        statdata['tick'] = int(tick)
                        statdata['timestamp'] = tickstats['time']
                        res = self.es.index(index=indexname, doc_type="stats", body=statdata)
                else:
                    groupstats['tick'] = int(tick)
                    groupstats['timestamp'] = tickstats['time']
                    res = self.es.index(index=indexname, doc_type="stats", body=groupstats)
            confirm_queue.append(tick)

        self.confirm(confirm_queue)

    def confirm(self, ticks):
        javascript_clear = 'Stats.removeTick(' + json.dumps(ticks, separators=(',',':')) + ');'
        sconn = self.getScreepsAPI()
        sconn.console(javascript_clear)


if __name__ == "__main__":
    settings = getSettings()
    screepsconsole = ScreepsMemoryStats(u=settings['screeps_username'], p=settings['screeps_password'], ptr=settings['screeps_ptr'])
    screepsconsole.run_forever()
