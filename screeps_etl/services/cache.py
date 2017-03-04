from beaker.cache import CacheManager
from beaker.util import parse_cache_config_options

from settings import getSettings
settings = getSettings()

if 'CACHE_ROOT' in settings:
    cache_root = settings['CACHE_ROOT']
else:
    cache_root = '/tmp/screepsstats'

cache_opts = {
    'cache.type': 'file',
    'cache.data_dir': cache_root + '/data',
    'cache.expire': 3600,
    'cache.lock_dir': cache_root + '/lock'
}

cache = CacheManager(**parse_cache_config_options(cache_opts))
