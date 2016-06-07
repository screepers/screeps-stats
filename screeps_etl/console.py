#!/usr/bin/env python

from datetime import datetime
from elasticsearch import Elasticsearch
import getopt
import screepsapi
from settings import getSettings
import sys

## Python before 2.7.10 or so has somewhat broken SSL support that throws a warning; suppress it
import warnings; warnings.filterwarnings('ignore', message='.*true sslcontext object.*')

class ScreepsConsole(screepsapi.Socket):

    es = Elasticsearch()

    def set_subscriptions(self):
        self.subscribe_user('console')
        self.subscribe_user('cpu')

    def process_log(self, ws, message):
        body = {
            'timestamp': datetime.now(),
            'message': message
        }
        res = self.es.index(index="screeps-console", doc_type="log", body=body)
        print res

    def process_results(self, ws, message):
        body = {
            'timestamp': datetime.now(),
            'message': message
        }
        res = self.es.index(index="screeps-console", doc_type="result", body=body)
        print res


    def process_error(self, ws, message):
        body = {
            'timestamp': datetime.now(),
            'message': message
        }
        res = self.es.index(index="screeps-console", doc_type="error", body=body)
        print res

    def process_cpu(self, ws, data):
        body = {
            'timestamp': datetime.now()
        }

        if 'cpu' in data:
            body['cpu'] = data['cpu']
            print data['cpu']

        if 'memory' in data:
            body['memory'] = data['memory']
            print data['memory']

        if 'cpu' in data or 'memory' in data:
            res = self.es.index(index="screeps-performance", doc_type="performance", body=body)
            print res



if __name__ == "__main__":

    opts, args = getopt.getopt(sys.argv[1:], "hi:o:",["ifile=","ofile="])
    settings = getSettings()
    screepsconsole = ScreepsConsole(user=settings['screeps_username'], password=settings['screeps_password'], ptr=settings['screeps_ptr'])
    screepsconsole.start()
