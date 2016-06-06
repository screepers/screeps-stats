#!/usr/bin/env python

import getopt

import screepsapi
from settings import getSettings
import sys

## Python before 2.7.10 or so has somewhat broken SSL support that throws a warning; suppress it
import warnings; warnings.filterwarnings('ignore', message='.*true sslcontext object.*')

class ScreepsConsole(screepsapi.Socket):

    def set_subscriptions(self):
        self.subscribe_user('console')
        self.subscribe_user('cpu')

    def process_log(self, ws, message):
        print message

    def process_results(self, ws, message):
        print message

    def process_error(self, ws, message):
        print message

    def process_cpu(self, ws, data):
        if 'cpu' in data:
            print data['cpu']

        if 'memory' in data:
            print data['memory']



if __name__ == "__main__":

    opts, args = getopt.getopt(sys.argv[1:], "hi:o:",["ifile=","ofile="])
    settings = getSettings()
    screepsconsole = ScreepsConsole(user=settings['screeps_username'], password=settings['screeps_password'], ptr=settings['screeps_ptr'])
    screepsconsole.start()
