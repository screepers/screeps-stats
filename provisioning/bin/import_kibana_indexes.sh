#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR


elasticdump \
    --input=$DIR/../kibana_index/kibana-analyzer.json \
    --output=http://localhost:9200/.kibana \
    --type=analyzer

elasticdump \
    --input=$DIR/../kibana_index/kibana-mapping.json \
    --output=http://localhost:9200/.kibana \
    --type=mapping

elasticdump \
    --input=$DIR/../kibana_index/kibana-data.json \
    --output=http://localhost:9200/.kibana \
    --type=data
