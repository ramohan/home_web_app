'use strict';
module.exports = function(grunt) {
  // Load all tasks
  require('load-grunt-tasks')(grunt);
  // Show elapsed time
  require('time-grunt')(grunt);

  grunt.initConfig({
    less: {
      dev: {
        files: {
          'css/layout.css': [
            'less/layout.less'
          ]
        },
        options: {
          compress: false,
          // LESS source map
          // To enable, set sourceMap to true and update sourceMapRootpath based on your install
          sourceMap: true,
          sourceMapFilename: 'css/layout.css.map',
          sourceMapRootpath: '/HubbleWebApp/webapp/'
        }
      },
      build: {
        files: {
          'css/layout.min.css': [
            'less/layout.less'
          ]
        },
        options: {
          compress: true
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
      },
      dev: {
        options: {
          map: {
            prev: 'css/'
          }
        },
        src: 'css/layout.css'
      },
      build: {
        src: 'css/layout.min.css'
      }
    },
    modernizr: {
      build: {
        devFile: 'vendor/modernizr/modernizr.js',
        outputFile: 'vendor/modernizr.min.js',
        files: {
          'src': [
            ['css/layout.min.css']
          ]
        },
        uglify: true,
        parseFiles: true
      }
    },

    watch: {
      less: {
        files: [
          'less/*.less',
          'less/**/*.less',
          'css/defaulttheme/*.css',
        ],
        tasks: ['less:dev', 'autoprefixer:dev']
      },
      livereload: {
        // Browser live reloading
        // https://github.com/gruntjs/grunt-contrib-watch#live-reloading
        options: {
          livereload: true
        },
        files: [
          'css/layout.css',
        ]
      }
    }
  });

  // Register tasks
  grunt.registerTask('default', [
    'dev'
  ]);
  grunt.registerTask('dev', [
    //'jshint',
    'less:dev',
    'autoprefixer:dev',
  ]);
  grunt.registerTask('build', [
    'less:build',
    'autoprefixer:build',
    'modernizr',
  ]);
};
