#!/usr/bin/env bash

cd webapp/ &&
  git fetch &&
  git checkout staging &&
  git merge origin/staging &&
  supervisorctl -c $cfg/supervisord.conf reread &&
  supervisorctl -c $cfg/supervisord.conf update &&
  supervisorctl -c $cfg/supervisord.conf restart hubble_server
