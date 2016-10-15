"use strict";

const gulp = require('gulp');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

gulp.task('concat-vendor', function () {
  return gulp.src(['assets/src/js/vendor/angular.js', 'assets/src/js/vendor/*.js'])
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('assets/build/js'));
});

gulp.task('compress-vendor', function () {
  return gulp.src('assets/build/js/vendor.min.js')
  .pipe(uglify())
  .pipe(gulp.dest('assets/build/js/'));
});


gulp.task('vendor', ['concat-vendor', 'compress-vendor']);
