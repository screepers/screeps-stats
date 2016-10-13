#!/usr/bin/env python
from bs4 import BeautifulSoup
from datetime import datetime
from elasticsearch import Elasticsearch
import getopt
import screepsapi
from settings import getSettings
import sys
import time
import os

## Python before 2.7.10 or so has somewhat broken SSL support that throws a warning; suppress it
import warnings; warnings.filterwarnings('ignore', message='.*true sslcontext object.*')

class ScreepsConsole(screepsapi.Socket):

    ELASTICSEARCH_HOST = 'elasticsearch' if 'ELASTICSEARCH' in os.environ else 'localhost'
    es = Elasticsearch([ELASTICSEARCH_HOST])

    def set_subscriptions(self):
        self.subscribe_user('console')
        self.subscribe_user('cpu')

    def process_log(self, ws, message):

        message_soup = BeautifulSoup(message,  "lxml")

        body = {
            'timestamp': datetime.now(),
            'mtype': 'log'
        }

        if message_soup.log:
            tag = message_soup.log
        elif message_soup.font:
            tag = message_soup.font
        else:
            tag = False

        if tag:
            for key,elem in tag.attrs.items():
                if key == 'color':
                    continue

                # If it's an integer convert it from string
                if elem.isdigit():
                    body[key] = int(elem)
                    continue

                # Check to see if it is a float
                try:
                    newelem = float(elem)
                    body[key] = newelem
                except ValueError:
                    pass

                # Okay fine it's a string
                body[key] = elem

        message_text = message_soup.get_text()

        if ':' in message_text:
            parts = message_text.partition(':')
            message_text = parts[2]

        message_text.strip()
        body['message'] = message_text.replace("\t", ' ')
        res = self.es.index(index="screeps-console-" + time.strftime("%Y_%m"), doc_type="log", body=body)

    def process_results(self, ws, message):
        body = {
            'timestamp': datetime.now(),
            'message': message,
            'mtype': 'results'
        }
        res = self.es.index(index="screeps-console-" + time.strftime("%Y_%m"), doc_type="log", body=body)

    def process_error(self, ws, message):
        body = {
            'timestamp': datetime.now(),
            'message': message,
            'mtype': 'error',
            'severity': 5
        }
        res = self.es.index(index="screeps-console-" + time.strftime("%Y_%m"), doc_type="log", body=body)

    def process_cpu(self, ws, data):
        body = {
            'timestamp': datetime.now()
        }

        if 'cpu' in data:
            body['cpu'] = data['cpu']

        if 'memory' in data:
            body['memory'] = data['memory']

        if 'cpu' in data or 'memory' in data:
            res = self.es.index(index="screeps-performance-" + time.strftime("%Y_%m"), doc_type="performance", body=body)


if __name__ == "__main__":
    opts, args = getopt.getopt(sys.argv[1:], "hi:o:",["ifile=","ofile="])
    settings = getSettings()
    screepsconsole = ScreepsConsole(user=settings['screeps_username'], password=settings['screeps_password'], ptr=settings['screeps_ptr'])
    screepsconsole.start()
