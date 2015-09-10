import os.path
import sys

basepath = os.path.dirname(__file__)
filepath = os.path.abspath(os.path.join(basepath, '..', 'config', 'env'))

def get_env():
  f = open(filepath, 'r')
  env = f.read()
  env = env.join(env.split())
  if env != 'dev' and env != 'prod' and env != 'staging':
    # assume prod by default
    env = 'staging'
  return env


