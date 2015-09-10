
import os
import glob
from jsmin import jsmin
from cssmin import cssmin
import config

class MinCatenator():
  """
  Mincatenator minifies and concantenates JS, CSS and templates. This class
  is given a list of files and walks through, recursively scanning directories
  (globbing for wilcards) and returns the minified, combined string when the
  charismatically named "mincatenate()" method is called.
  """
  def __init__(self, basepath):
    self.min_str = ''
    self.basepath = basepath
    self.debug = False

  def mincatenate(self, mainfile='', file_list=[]):
    """
    mainfile will be processed first and everything else will be appended
    to it.
    """
    self.min_str = ''
    if mainfile != '':
      self.minfile(mainfile)
    for d in file_list:
      self.scanfile("{}/{}".format(self.basepath, d))
    return self.min_str

  def scanfile(self, dir):
    if self.debug:
      print "Scanning: {}".format(dir)
    for f in glob.glob(dir):
      if os.path.isdir(f):
        if self.debug:
          print "Subdir: {}..".format(f)
        self.scanfile("{}/*".format(f))
      else:
        if self.debug:
          print "Minifying: {}".format(f)
        self.minfile(f)

  def append_template(self, path, contents):
    """
    A special case, rather than mincatenated, templates are placed within
    a script element with a custom type and inserted into index.html.
    """
    # get everything after "templates/"
    name_start = path.index('templates/') + 10;
    template_name = path[name_start:].replace('/', '-')
    # remove extension
    template_name = template_name[0:-5]
    tag = '<script id="{}" type="text/template">\n{}\n</script>'. \
      format(template_name, contents.strip())
    self.min_str = "{}\n\n{}".format(self.min_str, tag)

  def minfile(self, f):
    sourcefile = open(f, 'r')
    ext = os.path.splitext(f)[1][1:]
    filename = f[self.basepath.__len__()+1:]
    # prepend filename before min blob in a comment for debugging
    if ext == 'css':
      minified = cssmin(sourcefile.read(), keep_bang_comments=True)
      self.min_str = "{}\n\n/*{}*/\n{}".format(self.min_str, filename, minified)
    elif ext == 'js':
      minified = jsmin(sourcefile.read())
      self.min_str = "{}\n\n// {}\n{}".format(self.min_str, filename, minified)
    elif ext == 'html':
      self.append_template(f, sourcefile.read())
    sourcefile.close()
    return
