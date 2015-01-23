var gulp = require('gulp'),
    concat = require('gulp-concat');

gulp.task('default', function () {
  return gulp.src('public/src/stylesheets/*.css')
      .pipe(concat('style.css'))
      .pipe(gulp.dest('public/build/stylesheets/'));
});