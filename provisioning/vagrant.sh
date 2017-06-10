#!/usr/bin/env bash

PROVISIONING_DIR='/vagrant/provisioning'

echo "** Adding Apt Mirrors **"

echo "** Disabling IPv6 **"
echo 'precedence ::ffff:0:0/96 100' >> /etc/gai.conf
echo "#disable ipv6" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.all.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.default.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.lo.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
sysctl -p


# Upgrade System
echo "** Upgrade System **"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y -f dist-upgrade


echo "** Initializing Firewall **"
mkdir /etc/iptables
cp -R $PROVISIONING_DIR/etc/iptables/* /etc/iptables/
iptables-restore < /etc/iptables/rules.v4
ip6tables-restore < /etc/iptables/rules.v6
echo iptables-persistent iptables-persistent/autosave_v4 boolean false | debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean false | debconf-set-selections
apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y -f -q iptables-persistent


$PROVISIONING_DIR/provision.sh

echo "** Install nginx **"
apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y -f -q install nginx apache2-utils
echo 'screepsstats' | htpasswd -i -c /etc/nginx/htpasswd.users kibanaadmin
cp $PROVISIONING_DIR/etc/nginx/sites-available/default /etc/nginx/sites-available/default
service nginx restart
