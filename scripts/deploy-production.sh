#!/usr/bin/env bash

cd webapp/ &&
  git fetch &&
  git checkout master &&
  git checkout -- webapp/js/hubble/hubble_config.js &&
  git merge origin/master
sed -i \
  -e "s/\/\/API_BASE: 'https:\/\/api\.hubble\.in\/'/API_BASE:'https:\/\/api\.hubble\.in\/'/i" \
  -e "s/API_BASE: 'https:\/\/ct-api\.hubble\.in\/'/\/\/API_BASE:'https:\/\/ct-api\.hubble\.in\/'/i" \
  -e "s/\/\/ RECURLY_TOKEN:'sjc-mqdJhdkWKgnENDKW78RNup'/RECURLY_TOKEN:'sjc-mqdJhdkWKgnENDKW78RNup'/i" \
  -e "s/RECURLY_TOKEN: 'sjc-EpKK378xY3xuRCeJDAQEtn'/\/\/RECURLY_TOKEN: 'sjc-EpKK378xY3xuRCeJDAQEtn'/i" \
  webapp/js/hubble/hubble_config.js
supervisorctl -c $cfg/supervisord.conf reread &&
  supervisorctl -c $cfg/supervisord.conf update &&
  supervisorctl -c $cfg/supervisord.conf restart hubble_server
