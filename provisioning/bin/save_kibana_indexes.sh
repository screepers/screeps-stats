#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

if [ ! -d "$DIR/../kibana_index" ]; then
  mkdir $DIR/../kibana_index
fi

elasticdump \
    --input=http://localhost:9200/.kibana  \
    --output=$ \
    --type=analyzer \
    > $DIR/../kibana_index/kibana-analyzer.json

elasticdump \
    --input=http://localhost:9200/.kibana  \
    --output=$ \
    --type=mapping \
    > $DIR/../kibana_index/kibana-mapping.json

elasticdump \
    --input=http://localhost:9200/.kibana  \
    --output=$ \
    --type=data \
    > $DIR/../kibana_index/kibana-data.json
