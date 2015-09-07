var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var path = require('path');
var fs = require('fs');
var del = require('del');
var Promise = require('bluebird');
var stream = require('stream');
var source = require('vinyl-source-stream');
var pkg = require(path.join(__dirname, 'package.json'));
var bwr = require(path.join(__dirname, 'bower.json'));
var TEST_DIR=path.join(__dirname, 'bower_components/' + pkg.name);
var DIST_DIR=path.join(__dirname, 'dist');


gulp.task('clean', function() {
  del([TEST_DIR, DIST_DIR])
    .then(function(paths){
      console.log('Deleted:\n\t', paths.join('\n\t'));
    });
});

function stash() {
  return Promise.try(function(){
    $.git.stash({ args: 'save --include-untracked "gulp-stash"' },
    function(err) {
      if (err) throw  err;
      return true;
    });
  });
}

function unstash(branch) {
  return Promise.try(function(){
    $.git.stash({ args: 'pop gulp-stash' }, function(err) {
      if (err) throw  err;
      return true;
    });
  });
}

function checkoutReleases() {
  return Promise.try(function() {
    $.git.checkout('releases', function(err) {
      if(err) throw err;
      return true;
    });
  });
}

gulp.task('co:releases', checkoutReleases);

function inc(importance) {
  return Promise.try(function() {
    return gulp.src(['./package.json', './bower.json'])
    .pipe($.bump({ type: importance }))
    .pipe(gulp.dest('./'))
    .pipe($.filter('package.json'))
  });
}

function push() {
  return new Promise.try(function() {
    $.git.exec({ args: 'push --all'}, function(err) {
      if(err) throw err;
      return true;
    });
  })
}

gulp.task('gh:rel',  function() {
    stash()
    .then(checkoutReleases())
    .then(inc('patch'))
    .then(commitReleases('versions bumped'))
    .then(push())
    .then(unstash());
});



gulp.task('test', function() {
  var bower_relative_path = path.relative(
    TEST_DIR,
    path.join(__dirname, 'bower_components/')
  );
  gulp.src(['tux-drag-drop.html', 'bower.json', 'package.json'])
    .pipe(gulp.dest(TEST_DIR));

  gulp.src(['lib/**/*.js', 'lib/**/*.html'])
    .pipe(gulp.dest(path.join(TEST_DIR, 'lib')));
});

gulp.task('default', ['test'], function() {});
