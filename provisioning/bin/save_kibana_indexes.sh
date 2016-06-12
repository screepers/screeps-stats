#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

if [ ! -d "$DIRECTORY" ]; then
  mkdir kibana_index
fi

elasticdump \
    --input=http://localhost:9200/.kibana  \
    --output=$ \
    --type=analyzer \
    > kibana_index/kibana-analyzer.json

elasticdump \
    --input=http://localhost:9200/.kibana  \
    --output=$ \
    --type=mapping \
    > kibana_index/kibana-mapping.json

elasticdump \
    --input=http://localhost:9200/.kibana  \
    --output=$ \
    --type=data \
    > kibana_index/kibana-data.json
