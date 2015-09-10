import tornado.ioloop
import tornado.web
import tornado.httpserver
from hubble_index_handler import HubbleIndexHandler
from hubble_static_file_handler import HubbleStaticFileHandler
import config
import os
from get_env import get_env

request_handlers = [
  (r'/(favicon.ico)', tornado.web.StaticFileHandler, {'path': '../webapp/images'}),
  (r'/(crossdomain.xml)', tornado.web.StaticFileHandler, {'path': '../webapp'}),
  (r'/js/(.*)', HubbleStaticFileHandler, {'path': '../webapp/js' }),
  (r'/css/(.*)', HubbleStaticFileHandler, {'path': '../webapp/css' }),
  (r'/images/(.*)', HubbleStaticFileHandler, {'path': '../webapp/images' }),
  (r'/fonts/(.*)', tornado.web.StaticFileHandler, {'path': '../webapp/fonts' }),
  (r'/lang/(.*)', HubbleStaticFileHandler, {'path': '../webapp/lang' }),
  (r'/', HubbleIndexHandler),
]

application = tornado.web.Application(request_handlers, debug=config.get('App', 'debug_mode'), compress_response=True)

certbase = os.path.dirname(os.path.realpath(__file__)) + '/../config/sslcerts/'
settings = dict()
if get_env() == 'prod':
  settings['ssl_options'] = {
    'certfile': certbase + 'hubbleconnected2015.chained.crt',
    'keyfile': certbase + 'hubbleconnected_com.key'
  }
else:
  settings['ssl_options'] = {
    'certfile': certbase + 'hubble_in.crt',
    'keyfile': certbase + 'hubble_in.key'
  }

http_server = tornado.httpserver.HTTPServer(application)
ssl_server = tornado.httpserver.HTTPServer(application, **settings)

if __name__ == "__main__":
  print "Starting Hubble Tornado server in %s mode..." % get_env()
  http_server.listen(config.get('Server', 'listen_port'))
  ssl_server.listen(config.get('Server', 'listen_port_https'))
  tornado.ioloop.IOLoop.instance().start()
