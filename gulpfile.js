var gulp = require('gulp');
const rename = require('gulp-rename');
const { parallel } = require('gulp');

function config (cb) {
    console.log(`Using config:`, process.env.NODE_ENV || "dev")
    if (process.env.NODE_ENV === "prod") {
        gulp.src('./src/config.prod.json')
            .pipe(rename('config.json'))
            .pipe(gulp.dest('./lib'));
    }
    else {
        gulp.src('./src/config.dev.json')
            .pipe(rename('config.json'))
            .pipe(gulp.dest('./lib'));
    }
    cb();
};

function localConfig (cb) {
    console.log(`Using config:`, process.env.NODE_ENV || "dev")
    if (process.env.NODE_ENV === "prod") {
        gulp.src('./src/config.prod.json')
            .pipe(rename('config.json'))
            .pipe(gulp.dest('./src'));
    }
    else {
        gulp.src('./src/config.dev.json')
            .pipe(rename('config.json'))
            .pipe(gulp.dest('./src'));
    }
    cb();
};

exports.config = parallel(config)
exports.localConfig = parallel(localConfig)
