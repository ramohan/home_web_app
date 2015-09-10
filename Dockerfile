FROM l3iggs/archlinux:latest
MAINTAINER Akiva Levy
RUN pacman -S --noconfirm gcc python2 python2-pip libxml2
VOLUME /hubble
ADD /config /hubble/config
ADD /logs /hubble/logs
ADD /server /hubble/server
ADD /webapp /hubble/webapp
ADD /requirements.txt /hubble/
ADD set-env.sh /set-env.sh
RUN chmod 0755 /set-env.sh
RUN pip2 install -r /hubble/requirements.txt
EXPOSE 8888 80
WORKDIR /hubble/server
CMD /set-env.sh && python2 hubble_server.py
