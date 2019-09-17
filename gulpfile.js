var gulp = require('gulp');
const rename = require('gulp-rename');
const { parallel } = require('gulp');

function config_dev (cb) {
    gulp.src('./src/config.json')
        .pipe(rename('config.json'))
        .pipe(gulp.dest('./lib'));
    cb();
};

function config_prod (cb) {
    gulp.src('./src/config.prod.json')
        .pipe(rename('config.json'))
        .pipe(gulp.dest('./lib'));
    cb();
};

// exports.config_ = parallel(config_dev)
exports.config_dev = parallel(config_dev)
exports.config_prod = parallel(config_prod)
