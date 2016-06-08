#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

elasticdump \
    --input=http://localhost:9200/.kibana  \
    --output=$ \
    --type=data \
    --searchBody='{"filter": { "or": [ {"type": {"value": "dashboard"}}, {"type": {"value": "config"}}, {"type": {"value": "index-pattern"}}, {"type" : {"value":"visualization"}}] }}' \
    > kibana-exported.json
