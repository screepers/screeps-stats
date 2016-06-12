#!/usr/bin/env bash

echo "** Adding Apt Mirrors **"
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt wily main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt wily-updates main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt wily-backports main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt wily-security main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list

echo "** Disabling IPv6 **"
echo 'precedence ::ffff:0:0/96 100' >> /etc/gai.conf
echo "#disable ipv6" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.all.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.default.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.lo.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
sysctl -p

echo "** Initializing Firewall **"
mkdir /etc/iptables
cp -R $DIR/etc/iptables/* /etc/iptables/
iptables-restore < /etc/iptables/rules.v4
ip6tables-restore < /etc/iptables/rules.v6

/vagrant/provisioning/provision.sh


echo "** Install nginx **"
apt_quiet_install nginx
apt_quiet_install apache2-utils
echo 'screepsstats' | htpasswd -i -c /etc/nginx/htpasswd.users kibanaadmin
cp $DIR/etc/nginx/sites-available/default /etc/nginx/sites-available/default
service nginx restart

