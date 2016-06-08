#!/usr/bin/env bash

# Get real directory in case of symlink
if [[ -L "${BASH_SOURCE[0]}" ]]
then
  DIR="$( cd "$( dirname $( readlink "${BASH_SOURCE[0]}" ) )" && pwd )"
else
  DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi
cd $DIR

ENV="$DIR/../env/bin/activate"
if [ -f $ENV ]; then
    source $ENV
fi

SCRIPT="$DIR/../screeps_etl/console.py"
$SCRIPT
