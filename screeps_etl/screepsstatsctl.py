#!/usr/bin/env python

from daemon import runner
import screepsstats

if __name__ == "__main__":
    app = screepsstats.App()
    daemon_runner = runner.DaemonRunner(app)
    daemon_runner.do_action()
