#!/usr/bin/env bash

echo "** Adding Apt Mirrors **"
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt trusty main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt trusty-updates main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt trusty-backports main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list
echo "$(echo deb mirror://mirrors.ubuntu.com/mirrors.txt trusty-security main restricted universe multiverse | cat - /etc/apt/sources.list)" > /etc/apt/sources.list

echo "** Disabling IPv6 **"
echo 'precedence ::ffff:0:0/96 100' >> /etc/gai.conf
echo "#disable ipv6" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.all.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.default.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
echo "net.ipv6.conf.lo.disable_ipv6 = 1" | tee -a /etc/sysctl.conf
sysctl -p

/vagrant/provisioning/provision.sh
