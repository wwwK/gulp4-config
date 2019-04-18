const { src, dest, parallel, series, watch } = require('gulp')
const changed = require('gulp-changed')
const sass = require('gulp-sass')
const cleanCSS = require('gulp-clean-css')
const autoprefixer = require('gulp-autoprefixer')
const gutil = require('gulp-util')
const uglify = require('gulp-uglify')
const plumber = require('gulp-plumber')
const browserSync = require('browser-sync').create()
const imagemin = require('gulp-imagemin')
const spritesmith = require('gulp.spritesmith')
const del = require('del')

// 开发目录配置
var SOURCE = {
  client: './',
  html: './html/',
  scss: './static/scss',
  js: './assets/js',
  font: './assets/fonts',
  icon: './static/icons',
  images: './static/images'
}

// 编译目录配置
var OUTPUT = {
  assets: './assets/',
  build: './',
  css: './assets/css',
  js: './assets/js',
  font: './assets/fonts',
  images: './assets/images'
}

// 编译html
function html() {
  var options = {
    removeComments: true, //清除HTML注释
    collapseWhitespace: false, //压缩HTML
    removeScriptTypeAttributes: false, //删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
    minifyJS: true, //压缩页面JS
    minifyCSS: true //压缩页面CSS
  }
  return src([`${SOURCE.client}/**/*.html`])
    .pipe(changed(OUTPUT.build, { hasChanged: changed.compareSha1Digest }))
    .pipe(dest(OUTPUT.build))
    .pipe(browserSync.stream())
}

// 编译scss
function scss() {
  return src([
    `${SOURCE.scss}/**/*.scss`,
    `!${SOURCE.scss}/variable.scss`,
    `!${SOURCE.scss}/mixin.scss`,
    `!${SOURCE.scss}/base.scss`
  ])
    .pipe(
      changed(OUTPUT.css, {
        hasChanged: changed.compareSha1Digest,
        extension: '.css'
      })
    )
    .pipe(plumber())
    .pipe(
      sass({
        includePaths: [`${SOURCE.scss}/`]
      }).on('error', function(err) {
        gutil.log('Less Error!', err.message)
        this.end()
      })
    )
    .pipe(
      autoprefixer({
        browsers: ['last 20 versions'],
        cascade: false
      })
    )
    .pipe(cleanCSS())
    .pipe(dest(OUTPUT.css))
}

// 编译js
function script() {
  return src(`${SOURCE.js}/**/*.js`)
    .pipe(changed(OUTPUT.js, { hasChanged: changed.compareSha1Digest }))
    .pipe(plumber())
    .pipe(uglify())
    .pipe(dest(OUTPUT.js))
}

function font() {
  return src([`${SOURCE.font}/**/*.*`])
    .pipe(changed(OUTPUT.font, { hasChanged: changed.compareSha1Digest }))
    .pipe(dest(OUTPUT.font))
    .pipe(browserSync.stream())
}

function image() {
  return src(`${SOURCE.images}/**/*.*`)
    .pipe(changed(OUTPUT.images, { hasChanged: changed.compareSha1Digest }))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(dest(OUTPUT.images))
}

function sprite() {
  return src(`${SOURCE.icon}/**/*.png`)
    .pipe(changed(OUTPUT.images, { hasChanged: changed.compareSha1Digest }))
    .pipe(
      spritesmith({
        imgName: `${OUTPUT.images}/sprite.png`,
        cssName: `${OUTPUT.css}/sprite.css`
      })
    )
    .pipe(dest(OUTPUT.build)) //输出目录
}

function reload() {
  browserSync.reload()
}

function sync() {
  browserSync.init({
    server: {
      baseDir: OUTPUT.build,
      port: 8000,
      livereload: true
    }
  })
}

function watchFiles() {
  watch(`${SOURCE.html}/**/*.html`, parallel(reload))
  watch(`${SOURCE.scss}/**/*.scss`, series(scss, reload))
  watch(
    [`${SOURCE.images}/**/*.png`, `${SOURCE.images}/**/*.jpg`],
    parallel(reload)
  )
}

function clean() {
  return del([`${OUTPUT.assets}`])
}

const build = parallel(clean, scss, sprite)
const watching = parallel(watchFiles, sync)

exports.scss = scss
exports.sprite = sprite
exports.build = build
exports.clean = clean
exports.watch = watching
exports.default = series(clean, parallel(build, watchFiles, sync))
