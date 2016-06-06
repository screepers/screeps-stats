#!/usr/bin/env bash

apt_quiet_install () {
   echo "Install package $1"
   apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y -f install $1
}


# Upgrade Package Manager
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | apt-key add -
echo "deb http://packages.elastic.co/elasticsearch/2.x/debian stable main" | tee -a /etc/apt/sources.list.d/elasticsearch-2.x.list
echo "deb http://packages.elastic.co/kibana/4.4/debian stable main" | tee -a /etc/apt/sources.list.d/kibana-4.4.x.list


# Upgrade System
apt-get update
apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y -f dist-upgrade


# Install Oracle Java
wget -nv --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u92-b14/jdk-8u92-linux-x64.tar.gz
mkdir /opt/jdk
tar -zxf jdk-8u92-linux-x64.tar.gz -C /opt/jdk
update-alternatives --install /usr/bin/java java /opt/jdk/jdk1.8.0_92/bin/java 100
update-alternatives --install /usr/bin/javac javac /opt/jdk/jdk1.8.0_92/bin/javac 100


# Install ElasticSearch
apt_quiet_install elasticsearch
cp /vagrant/provisioning/elasticsearch.yml /etc/elasticsearch/elasticsearch.yml
update-rc.d elasticsearch defaults 95 10
service elasticsearch start


# Install Kibana
apt_quiet_install kibana
mkdir /etc/kibana
cp /vagrant/provisioning/kibana.yml /etc/kibana/kibana.yml
update-rc.d kibana defaults 96 9
service kibana start


# nginx
apt_quiet_install nginx
apt_quiet_install apache2-utils
echo '' | htpasswd -i -c /etc/nginx/htpasswd.users kibanaadmin
cp /vagrant/provisioning/default /etc/nginx/sites-available/default
service nginx restart


apt_quiet_install git
apt_quiet_install python-pip

pip install virtualenv


cd /vagrant
virtualenv env
source /vagrant/env/bin/activate
pip install -r requirements.txt

