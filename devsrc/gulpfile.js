// INSTRUCTIONS
// 0.1 install NODE.JS
// 0.2 install NPM
// 0.3 permissions if needed: sudo chown -R terryzielke: /usr/local/lib/node_modules
// 0.4 install GULP: npm install --global gulp-cli
// 1. open this folder in terminal
// 2. run command 'gulp'
// 3. make changes to files in scss folder
// 4. gulp will compile code on save (saves to: themes/ [theme folder] /assets/css/)
// 5. refresh web page to see changes


const { src, dest, watch, series } = require('gulp')
const rename = require('gulp-rename');
const sass = require('gulp-sass')(require('sass'));
let sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

function buildStyles() {
    return src('scss/theme.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(rename('theme.min.css'))
        .pipe(sourcemaps.write())
        .pipe(dest('../accountbird/css/'))
}

function watchTask() {
    watch(['scss/**/*.scss'], buildStyles)
}

exports.default = series(buildStyles, watchTask)

// 6. terminate gulp with: COMAND+C