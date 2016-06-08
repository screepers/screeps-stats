#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

elasticdump \
    --input=kibana-exported.json \
    --output=http://localhost:9200/.kibana \
    --type=data
  