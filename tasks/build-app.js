"use strict";

const gulp = require('gulp');
const runSequence = require('run-sequence');
const watch = require('gulp-watch');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const ngAnnotate = require('gulp-ng-annotate');
const babel = require('gulp-babel');
const jade = require('gulp-jade');
const less = require('gulp-less');
const LessPluginCleanCSS = require('less-plugin-clean-css');

let cleanCSSPlugin = new LessPluginCleanCSS({ advanced: false });

gulp.task('concat', function () {
  return gulp.src(['assets/src/js/app.js', 'assets/src/js/*.js'])
    .pipe(concat('operation-zeus.min.js'))
    .pipe(gulp.dest('assets/build/js'));
});

gulp.task('annotate', function () {
  return gulp.src('assets/build/js/operation-zeus.min.js')
    .pipe(ngAnnotate())
    .pipe(gulp.dest('assets/build/js'))
});

gulp.task('babel', function () {
  return gulp.src('assets/build/js/operation-zeus.min.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('assets/build/js'))
});

gulp.task('compress', function () {
  return gulp.src('assets/build/js/operation-zeus.min.js')
    .pipe(uglify())
    .pipe(gulp.dest('assets/build/js'));
});

gulp.task('jade', function () {
  return gulp.src('html/src/**/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('html/build'))
});

gulp.task('less', function () {
  return gulp.src('assets/src/css/main.less')
    .pipe(less({
      plugins: [cleanCSSPlugin]
    }))
    .pipe(gulp.dest('assets/build/css'))
});

gulp.task('watch', function () {
  watch('assets/src/js/*.js', { ignoreInitial: false }, function () {
    gulp.start('build-app-js');
  });

  watch('assets/src/css/*.less', { ignoreInitial: false }, function () {
    gulp.start('less');
  });

  watch('html/src/**/*.jade',  { ignoreInitial: false }, function () {
    gulp.start('jade');
  });
});

gulp.task('default', ['watch']);
gulp.task('build-app-js', function (callback) {
  runSequence('concat', 'annotate', 'babel', 'compress', callback);
});
// gulp.task('default', ['concat', 'annotate', 'babel', 'compress']);
