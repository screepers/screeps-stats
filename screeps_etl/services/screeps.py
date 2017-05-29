
from services.cache import cache
from settings import getSettings
import screepsapi
import requests


allianceUrl = 'http://www.leagueofautomatednations.com/alliances.js'

def getScreepsAPI():
    settings = getSettings()
    return screepsapi.API(u=settings['screeps_username'],p=settings['screeps_password'],ptr=settings['screeps_ptr'])


@cache.cache(expire=3600)
def getRoomOwner(room):
    screeps = getScreepsAPI()
    room_overview = screeps.room_overview(room)
    if 'owner' in room_overview and room_overview['owner'] is not None:
        if 'username' in room_overview['owner']:
            return room_overview['owner']['username']
    return False


def getAllianceFromUser(username):
    alliances = getAllianceData()
    if username in alliances:
        return alliances[username]
    return False


@cache.cache(expire=3600)
def getAllianceData():
    alliances = requests.get(allianceUrl).json()
    alliances_processed = {}
    for alliance, allianceData in alliances.items():
        for member in allianceData['members']:
            alliances_processed[member] = alliance
    return alliances_processed

