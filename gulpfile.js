const path = require(`path`);
const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const sourcemap = require(`gulp-sourcemaps`);
const less = require(`gulp-less`);
const postcss = require(`gulp-postcss`);
const autoprefixer = require(`autoprefixer`);
const csso = require(`gulp-csso`);
const rename = require(`gulp-rename`);
const imagemin = require(`gulp-imagemin`);
const webp = require(`gulp-webp`);
const svgstore = require(`gulp-svgstore`);
const pug = require('gulp-pug');
const pugLinter = require('gulp-pug-linter');
const htmlValidator = require('gulp-w3c-html-validator');
const bemValidator = require('gulp-html-bem-validator');
const del = require(`del`);
const uglify = require(`gulp-uglify`);
const webpackStream = require(`webpack-stream`);
const webpackConfig = require(`./webpack.config.js`);
const concat = require("gulp-concat");
const server = require(`browser-sync`).create();

gulp.task(`pug`, function () {
  return gulp.src('src/pug/pages/*.pug')
      .pipe(plumber())
      .pipe(pugLinter({ reporter: 'default' }))
      .pipe(pug({ pretty: true }))
      .pipe(htmlValidator())
      .pipe(bemValidator())
      .pipe(gulp.dest(`build`));
});

gulp.task(`css`, function () {
  return gulp.src(`src/less/style.less`)
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(less())
      .pipe(postcss([autoprefixer({
        grid: true,
      })]))
      .pipe(gulp.dest(`build/css`))
      // .pipe(csso())
      .pipe(rename(`style.min.css`))
      .pipe(sourcemap.write(`.`))
      .pipe(gulp.dest(`build/css`))
      .pipe(server.stream());
});

gulp.task(`script`, function () {
  return gulp.src([`src/js/main.js`])
      .pipe(webpackStream(webpackConfig))
      .pipe(uglify())
      .pipe(gulp.dest(`build/js`));
});

gulp.task(`concat-js-main`, function () {
  return gulp.src([`src/js/main.js`, `src/js/utils/**/*.js`, `src/js/modules/**/*.js`])
    .pipe(concat(`main.readonly.js`))
    .pipe(gulp.dest(`build/js`));
});

gulp.task(`svgo`, function () {
  return gulp.src(`src/img/**/*.{svg}`)
      .pipe(imagemin([
        imagemin.svgo({
            plugins: [
              {removeViewBox: false},
              {removeRasterImages: true},
              {removeUselessStrokeAndFill: false},
            ]
          }),
      ]))
      .pipe(gulp.dest(`src/img`));
});

gulp.task(`imagemin`, function () {
  return gulp.src(`src/img/**/*.{png,jpg}`)
      .pipe(imagemin([
        imagemin.optipng({optimizationLevel: 3}),
        imagemin.mozjpeg({quality: 75, progressive: true}),
      ]))
      .pipe(gulp.dest(`src/img`));
});

gulp.task(`webp`, function () {
  return gulp.src(`src/img/**/*.{png,jpg}`)
      .pipe(webp({quality: 90}))
      .pipe(gulp.dest(`src/img`));
});

gulp.task(`sprite`, function () {
  return gulp.src(`src/img/sprite/*.svg`)
      .pipe(svgstore({inlineSvg: true}))
      .pipe(rename(`sprite_auto.svg`))
      .pipe(gulp.dest(`src/img/svg`));
});

gulp.task(`server`, function () {
  server.init({
    server: `build/`,
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  gulp.watch(`src/less/**/*.less`, gulp.series(`css`));
  gulp.watch(`src/pug/**/*.pug`, gulp.series(`pug`, `refresh`));
  gulp.watch(`src/pages/*.pug`, gulp.series(`pug`, `refresh`));

  gulp.watch(`src/img/sprite/*.svg`, gulp.series(`sprite`, `copysvg`, `pug`, `refresh`));
  gulp.watch(`src/img/svg/*.svg`, gulp.series(`copysvg`, `pug`, `refresh`));
  gulp.watch(`src/img/**/*.{png,jpg}`, gulp.series(`copypngjpg`, `pug`, `refresh`));
  gulp.watch(`src/js/**/*.js`, gulp.series(`script`, `refresh`));
});

gulp.task(`refresh`, function (done) {
  server.reload();
  done();
});

gulp.task(`copysvg`, function () {
  return gulp.src(`src/img/**/*.svg`, {base: `src`})
      .pipe(gulp.dest(`build`));
});

gulp.task(`copypngjpg`, function () {
  return gulp.src(`src/img/**/*.{png,jpg}`, {base: `src`})
      .pipe(gulp.dest(`build`));
});

gulp.task(`copy`, function () {
  return gulp.src([
    `src/fonts/**/*.{woff,woff2,otf}`,
    `src/img/**`,
    `src/video/**`,
    `src/favicon/**`,
  ], {
    base: `src`,
  })
      .pipe(gulp.dest(`build`));
});

gulp.task(`clean`, function () {
  return del(`build`);
});

gulp.task(`build`, gulp.series(
    `clean`,
    `svgo`,
    `copy`,
    `css`,
    `sprite`,
    `script`,
    `concat-js-main`,
    `pug`
));

gulp.task(`start`, gulp.series(`build`, `server`));
