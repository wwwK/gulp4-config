const { src, dest, parallel, series, watch } = require('gulp');
const changed = require('gulp-changed');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync');
const spritesmith = require('gulp.spritesmith');
const del = require('del');

// 开发目录配置
var SOURCE = {
    client: './client',
    html: './client',
    scss: './client/scss',
    js: './client/js',
    font: './client/fonts',
    icon: './client/icons',
    images: './client/images'
};

// 编译目录配置
var OUTPUT = {
    build: './build/',
    css: './build/css',
    js: './build/js',
    font: './build/fonts',
    images: './build/images'
};

// 编译html
function html() {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: false,//压缩HTML
        removeScriptTypeAttributes: false,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    return src([`${SOURCE.client}/**/*.html`])
        .pipe(changed(OUTPUT.build, {hasChanged: changed.compareSha1Digest}))
        .pipe(dest(OUTPUT.build))
        .pipe(browserSync.reload({stream: true}));
}

// 编译scss
function scss() {
    return src([`${SOURCE.scss}/**/*.scss`, `!${SOURCE.scss}/variable.scss`, `!${SOURCE.scss}/mixin.scss`,`!${SOURCE.scss}/base.scss`,])
        .pipe(changed(OUTPUT.css, {hasChanged: changed.compareSha1Digest}))
        .pipe(plumber())
        .pipe(sass({
                includePaths: [`${SOURCE.scss}/`]
            })
            .on('error', function (err) {
                gutil.log('Less Error!', err.message);
                this.end();
            })
        )
        .pipe(autoprefixer({
            browsers: ['last 20 versions'],
            cascade: false
        }))
        .pipe(cleanCSS())
        .pipe(dest(OUTPUT.css));
}

// 编译js
function script() {
    return src(`${SOURCE.js}/**/*.js`)
        .pipe(changed(OUTPUT.js, {hasChanged: changed.compareSha1Digest}))
        .pipe(uglify())
        .pipe(dest(OUTPUT.js));
}


function font() {
    return src([`${SOURCE.font}/**/*.*`])
        .pipe(changed(OUTPUT.font, {hasChanged: changed.compareSha1Digest}))
        .pipe(dest(OUTPUT.font))
        .pipe(browserSync.reload({stream: true}));
}

function image() {
    return src([`${SOURCE.images}/**/*.*`])
        .pipe(changed(OUTPUT.images, {hasChanged: changed.compareSha1Digest}))
        .pipe(dest(OUTPUT.images))
        .pipe(browserSync.reload({stream: true}));
}

function sprite() {
    return src(`${SOURCE.icon}/**/*.png`)
        .pipe(changed(OUTPUT.images, {hasChanged: changed.compareSha1Digest}))
        .pipe(spritesmith({
            imgName: 'images/sprite.png',
            cssName: 'css/sprite.css'
        }))
        .pipe(dest(OUTPUT.build)); //输出目录
}

function sync() {
    browserSync({
        server: {
            baseDir: OUTPUT.build,
            port: 8000,
            livereload: true
        }
    });
}

// 监听文件变化
function watchFiles() {
    watch(`${SOURCE.html}/**/*.html`, series(html));

    watch( `${SOURCE.scss}/**/*.scss`, series(scss));

    watch(`${SOURCE.js}/**/*.js`, series(script));

    watch(`${SOURCE.font}/**/*.*`, series(font));

    watch([`${SOURCE.images}/**/*.png`, `${SOURCE.images}/**/*.jpg`], series(image));

    watch([`${SOURCE.icon}/**/*.png`, `${SOURCE.icon}/**/*.jpg`], series(sprite));
}

function clean() {
    return del([OUTPUT.build])
}

const serve = parallel(html, scss, script, image, font, sprite);

exports.default = series(clean, serve, watchFiles, sync);
exports.build = serve;
exports.clean = clean;
exports.sprite = sprite;