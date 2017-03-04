#!/usr/bin/env python

from datetime import datetime
from elasticsearch import Elasticsearch
import json
import screepsapi
from settings import getSettings
import six
import time
import os
import services.screeps as screeps_service


class ScreepsMemoryStats():

    ELASTICSEARCH_HOST = 'elasticsearch' if 'ELASTICSEARCH' in os.environ else 'localhost'
    es = Elasticsearch([ELASTICSEARCH_HOST])

    def __init__(self, u=None, p=None, ptr=False):
        self.user = u
        self.password = p
        self.ptr = ptr
        self.processed_ticks = []

    def getScreepsAPI(self):
        if not self.__api:
            settings = getSettings()
            self.__api = screepsapi.API(u=settings['screeps_username'],p=settings['screeps_password'],ptr=settings['screeps_ptr'])
        return self.__api
    __api = False

    def run_forever(self):
        while True:
            self.collectMemoryStats()
            self.collectMarketHistory()
            time.sleep(5)

    def collectMarketHistory(self):
        screeps = self.getScreepsAPI()
        market_history = screeps.market_history()

        if 'list' not in market_history:
            return

        for item in market_history['list']:
            item['id'] = item['_id']
            del item['_id']
            if item['type'] == 'market.fee':
                if 'extendOrder' in item['market']:
                    item['addAmount'] = item['market']['extendOrder']['addAmount']
                elif 'order' in item['market']:
                    item['orderType'] = item['market']['order']['type']
                    item['resourceType'] = item['market']['order']['resourceType']
                    item['price'] = item['market']['order']['price']
                    item['totalAmount'] = item['market']['order']['totalAmount']
                    item['roomName'] = item['market']['order']['roomName']
                else:
                    continue
                self.saveFee(item)
            else:
                item['resourceType'] = item['market']['resourceType']
                item['price'] = item['market']['price']
                item['totalAmount'] = item['market']['amount']
                if 'roomName' in item['market']:
                    item['roomName'] = item['market']['roomName']

                if 'targetRoomName' in item['market']:
                    item['targetRoomName'] = item['market']['targetRoomName']
                    user = screeps_service.getRoomOwner(item['targetRoomName'])
                    if user:
                        item['player'] = user
                        alliance = screeps_service.getAllianceFromUser(user)
                        if alliance:
                            item['alliance'] = alliance
                    
                    if 'npc' in item['market']:
                    item['npc'] = item['market']['npc']
                else:
                    item['npc'] = False
                self.saveOrder(item)

    def saveFee(self, order):
        date_index = time.strftime("%Y_%m")
        indexname = 'screeps-market-fees_' + date_index
        if not self.es.exists(index=indexname, doc_type="orders", id=order['id']):
            self.es.index(index=indexname,
                          doc_type="fees",
                          id=order['id'],
                          timestamp=order['date'],
                          body=order)

    def saveOrder(self, order):
        date_index = time.strftime("%Y_%m")
        indexname = 'screeps-market-orders_' + date_index

        if not self.es.exists(index=indexname, doc_type="orders", id=order['id']):
            self.es.index(index=indexname,
                          doc_type="orders",
                          id=order['id'],
                          timestamp=order['date'],
                          body=order)



    def collectMemoryStats(self):
        screeps = self.getScreepsAPI()
        stats = screeps.memory(path='___screeps_stats')
        if 'data' not in stats:
            return False

        # stats[tick][group][subgroup][data]
        # stats[4233][rooms][W43S94] = {}
        date_index = time.strftime("%Y_%m")
        confirm_queue =[]
        for tick,tick_index in stats['data'].items():
            if int(tick) in self.processed_ticks:
                continue

            # Is tick_index a list of segments or the data itself?
            if isinstance(tick_index, list):
                rawstring = ''
                for segment_id in tick_index:
                    segment = screeps.get_segment(segment=int(segment_id))
                    if 'data' in segment and len(segment['data']) > 1:
                        rawstring = segment['data']
                    else:
                        # Segment may not be ready yet - try again next run.
                        return
                try:
                    tickstats = json.loads(rawstring)
                except:
                    continue
            else:
                tickstats = tick_index

            self.processed_ticks.append(int(tick))
            if len(self.processed_ticks) > 20:
                self.processed_ticks.pop(0)
            for group, groupstats in tickstats.items():

                indexname = 'screeps-stats-' + group + '_' + date_index
                if not isinstance(groupstats, dict):
                    continue

                if 'subgroups' in groupstats:
                    for subgroup, statdata in groupstats.items():
                        if subgroup == 'subgroups':
                            continue

                        statdata[group] = subgroup
                        savedata = self.clean(statdata)
                        savedata['tick'] = int(tick)
                        savedata['timestamp'] = tickstats['time']
                        self.es.index(index=indexname, doc_type="stats", body=savedata)
                else:
                    savedata = self.clean(groupstats)
                    savedata['tick'] = int(tick)
                    savedata['timestamp'] = tickstats['time']
                    self.es.index(index=indexname, doc_type="stats", body=savedata)
            confirm_queue.append(tick)

        self.confirm(confirm_queue)

    def confirm(self, ticks):
        javascript_clear = 'Stats.removeTick(' + json.dumps(ticks, separators=(',',':')) + ');'
        sconn = self.getScreepsAPI()
        sconn.console(javascript_clear)

    def clean(self, datadict):
        newdict = {}
        for key, value in datadict.iteritems():
            try:
                newdict[key] = float(value)
            except:
                newdict[key] = value
        return datadict


if __name__ == "__main__":
    settings = getSettings()
    screepsconsole = ScreepsMemoryStats(u=settings['screeps_username'], p=settings['screeps_password'], ptr=settings['screeps_ptr'])
    screepsconsole.run_forever()
