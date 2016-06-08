#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
pwd

apt_quiet_install () {
   echo "** Install package $1 **"
   apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y -f install $1
}


# Upgrade Package Manager
echo "** Add Package Manager Repositories **"
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | apt-key add -
echo "deb http://packages.elastic.co/elasticsearch/2.x/debian stable main" | tee -a /etc/apt/sources.list.d/elasticsearch-2.x.list
echo "deb http://packages.elastic.co/kibana/4.4/debian stable main" | tee -a /etc/apt/sources.list.d/kibana-4.4.x.list

wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
echo 'deb https://deb.nodesource.com/node_6.x trusty main' > /etc/apt/sources.list.d/nodesource.list
echo 'deb-src https://deb.nodesource.com/node_6.x trusty main' >> /etc/apt/sources.list.d/nodesource.list


# Upgrade System
echo "** Upgrade System **"
apt-get update
apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y -f dist-upgrade


# Install Development Tools
echo "** Install Development Tools **"
apt_quiet_install git
apt_quiet_install iptables-persistent
apt_quiet_install nodejs
apt_quiet_install npm
apt_quiet_install python-dev
apt_quiet_install libffi-dev
apt_quiet_install libssl-dev
apt_quiet_install libxml2-dev
apt_quiet_install libxslt-dev
apt_quiet_install libyaml-dev
apt_quiet_install python-pip

echo "** Install virtualenv **"
pip install virtualenv

echo "** Install elasticdump **"
npm install elasticdump -g


echo "** Initializing Firewall **"
mkdir /etc/iptables
cp -R $DIR/etc/iptables/* /etc/iptables/
iptables-restore < /etc/iptables/rules.v4
ip6tables-restore < /etc/iptables/rules.v6


# Install Oracle Java
echo "** Install OracleJDK **"
cd /tmp
wget -nv --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u92-b14/jdk-8u92-linux-x64.tar.gz
mkdir /opt/jdk
tar -zxf jdk-8u92-linux-x64.tar.gz -C /opt/jdk
update-alternatives --install /usr/bin/java java /opt/jdk/jdk1.8.0_92/bin/java 100
update-alternatives --install /usr/bin/javac javac /opt/jdk/jdk1.8.0_92/bin/javac 100


# Install ElasticSearch
apt_quiet_install elasticsearch
cp $DIR/elasticsearch.yml /etc/elasticsearch/elasticsearch.yml
update-rc.d elasticsearch defaults 95 10
service elasticsearch start


# Install Kibana
apt_quiet_install kibana
mkdir /etc/kibana
cp $DIR/kibana.yml /etc/kibana/kibana.yml
update-rc.d kibana defaults 96 9

echo "** Install Kibana Plugins **"
/opt/kibana/bin/kibana plugin -i elastic/timelion
/opt/kibana/bin/kibana plugin -i tagcloud -u https://github.com/stormpython/tagcloud/archive/master.zip
chown -R kibana:kibana /opt/kibana

echo "** Load Kibana Configuration **"
./import_dashboards.sh
service kibana start


# nginx
apt_quiet_install nginx
apt_quiet_install apache2-utils
echo 'screepsstats' | htpasswd -i -c /etc/nginx/htpasswd.users kibanaadmin
cp $DIR/default /etc/nginx/sites-available/default
service nginx restart


# Activate VirtualEnvironment and install dependencies
echo "** Create VirtualENV and Install Dependencies **"
cd $DIR/../
virtualenv env
source ./env/bin/activate
yes w | pip install --upgrade -r requirements.txt

