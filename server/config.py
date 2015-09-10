import ConfigParser
from get_env import get_env
import os.path
import sys

basepath = os.path.dirname(__file__)
filepath = os.path.abspath(os.path.join(basepath, '..', 'config', 'app.ini'))
config = ConfigParser.ConfigParser()
config.readfp(open(filepath, 'r'))

def get(category, name):
  if name == 'js_files' or name == 'css_files' or name == 'templates_dir':
    return make_nice_list(config.get(category, name))
  # Apply common config changes based on the environment in which
  # the code is running.
  if config.get('App', 'auto_config'):
    if category == 'App' and name == 'debug_mode':
      if get_env() in ('prod', 'staging'):
        return False
      else:
        return True
    elif category == 'Optimization' and name == 'optimize_js':
      if get_env() in ('prod', 'staging'):
        return True
      else:
        return False
  val = config.get(category, name)
  # haven't tested it, but ConfigParser might already handle this
  val = normalize_bool(val)
  return val

def normalize_bool(value):
  if value == 'True' or value == 'TRUE' or value == 'true':
    return True
  elif value == 'False' or value == 'FALSE' or value == 'false':
    return False
  return value

def make_nice_list(value):
  split = value.splitlines()
  newvalue = []
  for line in split:
    line = line.strip(' \t\n\r')
    if line == '':
      continue
    newvalue.append(line)
  return newvalue

if __name__ == "__main__":
  print(get('Optimization', 'js_files'))
