#!/usr/bin/env python

from console import ScreepsConsole
from daemon import runner
import logging
import multiprocessing
import os
from settings import getSettings
import signal
import lockfile
import threading


base_directory = '/tmp/screepsstats'
base_directory = os.path.expanduser('~')
if not os.path.exists(base_directory):
    os.makedirs(base_directory)


class App():

    def __init__(self):
        self.stdin_path = '/dev/null'
        self.stdout_path = '/dev/null'
        #self.stdout_path = base_directory + '/screepsstats.out'
        self.stderr_path = base_directory + '/screepsstats.err'
        self.pidfile_path =  base_directory + '/screepsstats.pid'
        self.pidfile_timeout = 5


    def run(self):
        logging.basicConfig(level=logging.WARN)
        logger = logging.getLogger("ScreepsStats")
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        handler = logging.FileHandler(base_directory + "/screepsstats.log")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        websocketprocess = False
        while True:
            if not websocketprocess or not websocketprocess.is_alive():
                websocketprocess = WebsocketProcess()
                websocketprocess.daemon = True
                websocketprocess.start()
                websocketprocess.join()




class WebsocketProcess(multiprocessing.Process):

    def run(self):
        logging.basicConfig(level=logging.WARN)
        logger = logging.getLogger("ScreepsStats")
        logger.setLevel(logging.WARN)
        settings = getSettings()
        screepsconsole = ScreepsConsole(user=settings['screeps_username'], password=settings['screeps_password'], ptr=settings['screeps_ptr'])
        screepsconsole.start()

if __name__ == "__main__":
    app = App()
    daemon_runner = runner.DaemonRunner(app)
    daemon_runner.do_action()
