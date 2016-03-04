/*
  first we load in gulp
*/
var gulp = require('gulp');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var source = require('vinyl-source-stream');
var reactify = require('reactify');
var babelify = require('babelify');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var gutil = require('gulp-util');
var historyApiFallback = require('connect-history-api-fallback');

/*
  then we load all plugins into the p variable with gulp-load-plugins
  we do this so that we don't have to load each one individually
  you will see many examples online that call concat(), sass() or uglify()
  These are now just p.concat(), p.sass() or p.uglify()
*/
var p = require('gulp-load-plugins')();

// globs are basically pattern matches for files. We store them in an object
// because we use them both for gulp.src() as well as gulp.watch()
// if a change to the glob is needed, we simply edit it here rather than in 2 places
var globs = {
  "scripts" : ['source/js/*.js'],
  "styles"  : ['source/css/style.styl'],
  "templates"  : ['source/**/*.jade', '!source/**/layout.jade'],
  "images"  : ['source/images/**/*'],
}

gulp.task('scripts',function() {

  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './source/js/viewer.js',
    debug: true
  }).transform(babelify, {presets: ["es2015", "react"]});

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(p.plumber({errorHandler: p.notify.onError("Error: <%= error.message %>")}))
    .pipe(p.sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        // .pipe(p.uglify())
        .on('error', gutil.log)
    .pipe(p.sourcemaps.write('./'))
    .pipe(gulp.dest('./_build/js/'))
    .pipe(reload({stream:true}))
    .pipe(p.notify({
      title : 'Scripts Compiled!',
      sound:false
    }))
});

gulp.task('styles',function() {
  gulp.src(globs.styles , { base : 'source/css/' })
    .pipe(p.plumber({errorHandler: p.notify.onError("Error: <%= error.message %>")}))
    .pipe(p.stylus())
    .pipe(p.autoprefixer())
    .pipe(gulp.dest('./_build/css/'))
    .pipe(reload({stream:true}))
});

gulp.task('templates',function() {
  gulp.src(globs.templates, { base : 'source/' })
    .pipe(p.jade({pretty: true}))
    .pipe(p.debug())
    .pipe(gulp.dest('./_build/'))
    .pipe(reload({stream:true}))
});

gulp.task('images',function() {
  const dest = '_build/images';

  return gulp.src(globs.images, { base : 'source/images' })
      .pipe(p.changed(dest))
      .pipe(p.debug())
      .pipe(p.imagemin({
          progressive: true,
          svgoPlugins: [{removeViewBox: false}]
      }))
      .pipe(gulp.dest(dest))
});

gulp.task('fonts',function() {
  gulp.src('source/css/fonts/**/*', { base : 'source/css/fonts' })
  .pipe(gulp.dest('_build/css/fonts'))
});

gulp.task('htaccess',function() {
  gulp.src('source/.htaccess', { base : 'source/' })
    .pipe(gulp.dest('_build/'))
});

gulp.task('videos',function() {
  gulp.src('source/images/**/*.mp4', { base : 'source/images' })
    .pipe(gulp.dest('_build/images/'))
});

// Start the server
gulp.task('browser-sync', function() {
    browserSync({
        open : false,
        middleware : [ historyApiFallback() ],
        server: {
            baseDir: "./_build"
        }
    });
});

gulp.task('clean',function() {
  // we return it so it runs async
  return gulp.src('_build/',{read:false})
    .pipe(p.clean({ force : true }))
});

gulp.task('watch', ['browser-sync'] ,function() {
  gulp.watch(globs.scripts,['scripts']);
  gulp.watch(globs.styles,['styles']);
  gulp.watch(globs.templates,['templates']);
});


gulp.task('deploy', function() {
  gulp.src('_build/**/*', { base : '_build/' })
    .pipe(p.sftp({
        host: 'bostype.com',
        user : 'bostypec',
        remotePath : '/home3/bostypec/www/masteringmarkdown'
    }));
});

// the default tasks runs when you simply type 'gulp'
gulp.task('default',['styles','fonts','scripts','images','templates','htaccess','videos','watch']);
