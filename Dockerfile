FROM python:2.7
MAINTAINER patryk.perduta@gmail.com

RUN git clone https://github.com/screepers/screeps-stats /screeps-stats
COPY .screeps_settings.yaml /screeps-stats
WORKDIR /screeps-stats

RUN pip install -r requirements.txt

CMD python screeps_etl/screepsstats.py
