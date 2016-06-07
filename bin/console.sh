#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

ENV="$DIR/../env/bin/activate"
if [ -f $ENV ]; then
    source $ENV
fi

SCRIPT="$DIR/../screeps_etl/console.py"
$SCRIPT
