#!/usr/bin/env bash

if [ -z "$ENV" ]; then
  ENV="dev"
fi

touch /hubble/config/env
echo $ENV > /hubble/config/env
