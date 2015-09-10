import tornado.ioloop
import tornado.web
from mincatenator import MinCatenator
import os
import config
import time

class HubbleIndexHandler(tornado.web.RequestHandler):
  def initialize(self):
    self.cached_index = ''

  def get(self):
    self.render('../webapp/index.html')

  def render_string(self, template_name, **kwargs):
    """
    Combine all templates found in templates_dir into one string and insert
    them into index.html in order to reduce HTTP requests.
    """
    if not config.get('Optimization', 'optimize_templates'):
      return super(HubbleIndexHandler, self).render_string(template_name, **kwargs)
    if self.cached_index != '':
      return self.cached_index;

    indexfile = open('../webapp/index.html', 'r')
    indexhtml = indexfile.read()
    indexfile.close()
    basepath = os.path.dirname(os.path.realpath(__file__)) + '/../webapp'
    minifier = MinCatenator(basepath)
    templates = minifier.mincatenate(file_list=config.get('Optimization', 'templates_dir'))
    main_div = '<div id="page_content"></div>'.format(templates)
    new_main_div = "{}\n{}".format(main_div, templates)
    epoch_time = str(time.time())
    new_content = indexhtml.replace(main_div, new_main_div).replace('XXX', epoch_time)

    # Cache this in memory for as long as the server is running.
    if config.get('App', 'debug_mode'):
      self.cached_index = new_content

    return new_content
