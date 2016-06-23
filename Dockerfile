FROM python:2.7
MAINTAINER patryk.perduta@gmail.com

RUN git clone https://github.com/screepers/screeps-stats /screeps-stats
COPY .screeps_settings.yaml /screeps-stats
WORKDIR /screeps-stats
RUN pip install -r requirements.txt
ENV ELASTICSEARCH 1

RUN git clone https://github.com/vishnubob/wait-for-it

CMD python screeps_etl/screepsstats.py
