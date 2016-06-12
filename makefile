
SHELL:=/bin/bash
ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: all fresh dependencies install fulluninstall uninstall removedeps


all: dependencies

fresh: fulluninstall dependencies

fulluninstall: uninstall cleancode

install:
	# Create link in /usr/local/bin to screeps stats program.
	ln -s -f $(ROOT_DIR)/bin/screepsstats.sh /usr/local/bin/screepsstats

	# Create link in /usr/local/bin to standalone service controller.
	ln -s -f $(ROOT_DIR)/bin/screepsstatsctl.sh /usr/local/bin/screepsstatsctl

	# Create screepsstats user- including home directory- for daemon
	id -u screepsstats &>/dev/null || useradd screepsstats --create-home --shell /bin/false -U

	# Move service file into place- note that symlinks will not work (bug 955379)
	if [ -d /etc/systemd/system ]; then \
		cp $(ROOT_DIR)/provisioning/etc/systemd/system/screepsstats.service /etc/systemd/system/screepsstats.service \
		systemctl enable screepsstats.service
		systemctl start screepsstats.service
	fi;

dependencies:
	if [ ! -d $(ROOT_DIR)/env ]; then virtualenv $(ROOT_DIR)/env; fi
	source $(ROOT_DIR)/env/bin/activate; pip install -r $(ROOT_DIR)/requirements.txt

uninstall:
	# Remove user and home.
	if getent passwd screepsstats > /dev/null 2>&1; then \
		pkill -9 -u `id -u screepsstats`; \
		deluser --remove-home screepsstats; \
	fi
	# Remove screepsstats link in /user/local/bin
	if [ -L /usr/local/bin/screepsstats.sh ]; then \
		rm /usr/local/bin/screepsstats; \
	fi;
	# Remove screepsstatsctl in /user/local/bin
	if [ -L /usr/local/bin/screepsstatsctl.sh ]; then \
		rm /usr/local/bin/screepsstatsctl; \
	fi;
	# Shut down, disbale, and remove all services.
	if [ -L /etc/systemd/system/screepsstats.service ]; then \
		systemctl disable screepsstats.service \
		systemctl stop screepsstats.service \
		rm /etc/systemd/system/screepsstats.service; \
	fi;

cleancode:
	# Remove existing environment
	if [ -d $(ROOT_DIR)/env ]; then \
		rm -rf $(ROOT_DIR)/env; \
	fi;
	# Remove compiled python files
	if [ -d $(ROOT_DIR)/screep_etl ]; then \
		rm -f $(ROOT_DIR)/screep_etl/*.pyc; \
	fi;
