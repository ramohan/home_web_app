import os
from mincatenator import MinCatenator
import config
import tornado
import stat

class HubbleStaticFileHandler(tornado.web.StaticFileHandler):
  COMBINED_CSS = ''
  COMBINED_JS = ''

  def set_extra_headers(self, path):
    if config.get('App', 'debug_mode'):
      self.set_header("Cache-control", "no-store, no-cache, must-revalidate, max-age=0")

  def _stat(self):
    """
    I am overriding the file size returned by the posix call with the
    size of the combined assets, in order to avoid tripping a tornado
    exception about sending more data than the Content-Length it detected.
    """
    stat_result = super(HubbleStaticFileHandler, self)._stat()
    serverdir = os.path.dirname(os.path.realpath(__file__)) + "/"
    jspath = '../webapp/js'
    basepath = os.path.dirname(os.path.realpath(serverdir + jspath))
    relpath = self.absolute_path[basepath.__len__()+1:]
    lst = list(stat_result)

    # Fix an issue with tornado failing to set the proper content-type
    # for svg files.
    if ".svg" in self.absolute_path:
      self.set_header("Content-Type", "image/svg+xml")

    if "main.js" in self.absolute_path and \
      config.get('Optimization', 'optimize_js'):
      if HubbleStaticFileHandler.COMBINED_JS == '':
        minifier = MinCatenator(basepath)
        HubbleStaticFileHandler.COMBINED_JS = minifier. \
          mincatenate("{}/js/main.js".format(basepath),
          file_list=config.get('Optimization', 'js_files'))

      size = len(HubbleStaticFileHandler.COMBINED_JS)
      self.set_header("Content-Length", size)
      lst[stat.ST_SIZE] = size

    if "layout.css" in self.absolute_path and \
      config.get('Optimization', 'optimize_css'):
      if HubbleStaticFileHandler.COMBINED_CSS == '':
        minifier = MinCatenator(basepath)
        HubbleStaticFileHandler.COMBINED_CSS = minifier. \
          mincatenate("{}/css/layout.css".format(basepath),
          file_list=config.get('Optimization', 'css_files'))
      size = len(HubbleStaticFileHandler.COMBINED_CSS)
      self.set_header("Content-Length", size)
      lst[stat.ST_SIZE] = size

    self._stat_result = tuple(lst)
    return self._stat_result

  @classmethod
  def get_content(cls, abspath, start=None, end=None):
    """
    Check if specific files are being requested and return them modified to
    contain a bunch of additional files, as specified by config lists above.
    """
    serverdir = os.path.dirname(os.path.realpath(__file__)) + "/"
    jspath = '../webapp/js'
    basepath = os.path.dirname(os.path.realpath(serverdir + jspath))
    relpath = abspath[basepath.__len__()+1:]

    if relpath == 'js/main.js' and config.get('Optimization', 'optimize_js'):
      js = cls.COMBINED_JS
      # The default behavior is to cache the combined files in memory
      # for as long as the server is running. debug_mode prevents this.
      if config.get('App', 'debug_mode'):
        cls.COMBINED_JS = ''
      return js

    elif relpath == 'css/layout.css' and \
      config.get('Optimization', 'optimize_css'):
      css = cls.COMBINED_CSS
      if config.get('App', 'debug_mode'):
        cls.COMBINED_CSS = ''
      return css
    else:
      return super(HubbleStaticFileHandler, cls).get_content(abspath, start, end)
