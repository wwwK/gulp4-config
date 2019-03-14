const { src, dest, parallel, series, watch } = require('gulp');
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const browsersync = require('browser-sync');
const csso = require('gulp-csso');
const del = require('del');

// 开发目录配置
var SOURCE = {
    client: './client', 
    html: './client',
    scss: './client/scss',
    js: './client/js',
    images: './client/images'
};

// 编译目录配置
var OUTPUT = {
    build: './build/',
    css: './build/css',
    js: './build/js',
    images: './build/images'
}

// 编译html.images
function copy() {
    return src([`${SOURCE.client}/**/*.html`, `${SOURCE.client}/**/*.*`])
        .pipe(dest(OUTPUT.build))
}

// 编译scss
function css() {
  return src([`${SOURCE.scss}/**/*.scss`, `!${SOURCE.scss}/variable.scss`, `!${SOURCE.scss}/mixin.scss`])
    .pipe(sourcemaps.init())
    // Stay live and reload on error
    .pipe(plumber({
        handleError: function (err) {
            console.log(err);
            this.emit('end');
        }
    }))
    .pipe(sass({
        includePaths: [`${SOURCE.scss}/`],
        outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(prefix(['last 15 versions','> 1%','ie 8','ie 7','iOS >= 9','Safari >= 9','Android >= 4.4','Opera >= 30'], {
        cascade: true
    }))
    .pipe(csso({
        restructure: false,
        sourceMap: true,
        debug: true
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(OUTPUT.css));
}

// 编译js
function js() {
    return src(`${SOURCE.JS}/**/*.js`)
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('.'))
    .pipe(dest(OUTPUT.js));
}

// BrowserSync
function browserSync() {
    browsersync({
        server: {
            baseDir: OUTPUT.build
        }
    });
}

// BrowserSync刷新 
function browserReload () {
    return browsersync.reload;
}

// 监听文件变化
function watchFiles() {
    watch( `${SOURCE.scss}/**/*.scss`, parallel(css))
    .on('change', browserReload());
    watch(`${SOURCE.js}/**/*.js`, parallel(js))
    .on('change', browserReload());
    watch(`${SOURCE.client}/**/*.html`, parallel(copy))
    .on('change', browserReload());
    watch(`${SOURCE.images}/**/*`)
    .on('change', series(copy, css, js, browserReload()));
}

function clean() {
    return del([OUTPUT.build])
}

const build = parallel(copy, css, js);
const watching = parallel(watchFiles, browserSync);

exports.js = js;
exports.css = css;
exports.copy = copy;
exports.default = series(clean, build);
exports.watch = watching;