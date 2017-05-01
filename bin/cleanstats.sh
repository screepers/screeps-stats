#!/usr/bin/env bash

STATS_MONTHS=2
TIMESTRING=$(date --date="$(date +%Y-%m-15) -${STATS_MONTHS} month" +%Y_%m)
echo curl -XDELETE "localhost:9200/screeps-stats*${TIMESTRING}?pretty"
curl -XDELETE "localhost:9200/screeps-stats*${TIMESTRING}?pretty"

CONSOLE_MONTHS=1
TIMESTRING=$(date --date="$(date +%Y-%m-15) -${CONSOLE_MONTHS} month" +%Y_%m)
echo curl -XDELETE "localhost:9200/screeps-console*${TIMESTRING}?pretty"
curl -XDELETE "localhost:9200/screeps-console*${TIMESTRING}?pretty"

ORDERS_MONTHS=4
TIMESTRING=$(date --date="$(date +%Y-%m-15) -${ORDERS_MONTHS} month" +%Y_%m)
echo curl -XDELETE "localhost:9200/screeps-orders*${TIMESTRING}?pretty"
curl -XDELETE "localhost:9200/screeps-orders*${TIMESTRING}?pretty"
