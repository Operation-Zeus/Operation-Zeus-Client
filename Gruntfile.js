module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: false,
        compress: true,
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'assets/src/js/*.js',
        dest: 'assets/build/js/<%= pkg.name %>.min.js'
      }
    },
    jade: {
      compile: {
        options: {
          pretty: false
        },
        files: [ {
          cwd: 'html/src',
          src: '**/*.jade',
          dest: 'html/build',
          expand: true,
          ext: '.html'
        } ]
      }
    },
    less: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        plugins: [
          new (require('less-plugin-clean-css'))
        ]
      },
      style: {
        files: {
          'assets/build/css/master.min.css': 'assets/src/css/main.less'
        }
      }
    },
    watch: {
      js: {
        files: ['assets/src/js/*.js'],
        tasks: ['uglify']
      },
      css: {
        files: 'assets/src/css/*.less',
        tasks: ['less']
      },
      jade: {
        files: ['html/src/*.jade', 'html/src/partials/*.jade', 'html/src/includes/*.jade'],
        tasks: ['jade']
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jade');

  // Default task(s).
  grunt.registerTask('default', ['watch']);
};
