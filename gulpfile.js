var gulp = require('gulp');
const rename = require('gulp-rename');
const { parallel } = require('gulp');

function config (cb) {
    if (process.env.NODE_ENV === "prod") {
        gulp.src('./src/config.prod.json')
            .pipe(rename('config.json'))
            .pipe(gulp.dest('./lib'));
    }
    else {
        gulp.src('./src/config.json')
            .pipe(rename('config.json'))
            .pipe(gulp.dest('./lib'));
    }
    console.log(`Using config:`, process.env.NODE_ENV)
    cb();
};


// exports.config_ = parallel(config_dev)
exports.config = parallel(config)
