#!/usr/bin/env node
/* eslint-disable no-console,import/no-dynamic-require,global-require */

const path    = require('path');
const spawn   = require('cross-spawn');
const program = require('commander');
const colors  = require('colors');
const async   = require('async');
const rimraf  = require('rimraf');
const { ncp } = require('ncp');
const shell   = require('shelljs');
const R       = require('ramda');
const fs      = require('fs');

ncp.limit = 16;

function startProcess() {
  console.log('[x] startProcess ...');
  const asunaRoot      = path.join(__dirname, '../server.js');
  process.env.NODE_ENV = 'dev';

  const proc = spawn('node', [asunaRoot], { stdio: 'inherit', customFds: [0, 1, 2] });
  proc.on('close', (code, signal) => {
    if (code !== null) {
      process.exit(code);
    }
    if (signal) {
      if (signal === 'SIGKILL') {
        process.exit(137);
      }
      console.log(`got signal ${signal}, exiting`);
      process.exit(1);
    }
    process.exit(0);
  });
  proc.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
  return proc;
}

function buildImage(buildArg, devMode) {
  console.log('[x] buildImage asuna-admin...');
  const asunaBuildPath = path.join(process.env.PWD, '.asuna');
  const command        = ['build', '-t', 'asuna-admin'];
  if (buildArg) {
    command.push('--build-arg', buildArg);
  }
  if (devMode) {
    command.push('-f', `${asunaBuildPath}/Dockerfile.dev`);
  }
  console.log('[x] buildImage run command:', command.join(' '));

  const proc = spawn('docker', [...command, asunaBuildPath], { stdio: 'inherit' });
  proc.on('close', (code, signal) => {
    if (code !== null) {
      process.exit(code);
    }
    if (signal) {
      if (signal === 'SIGKILL') {
        process.exit(137);
      }
      console.log(`got signal ${signal}, exiting`);
      process.exit(1);
    }
    process.exit(0);
  });
  proc.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
  return proc;
}

function mergeDependencies() {
  const appPackagePath   = path.join(process.env.PWD, '/package.json');
  const asunaPackagePath = path.join(__dirname, '../package.json');
  const distPackagePath  = path.join(process.env.PWD, '/.asuna/package.json');
  console.log('[x] appPackagePath is `%s`', appPackagePath);
  console.log('[x] asunaPackagePath is `%s`', asunaPackagePath);
  console.log('[x] distPackagePath is `%s`', distPackagePath);

  const appPackage   = require(appPackagePath);
  const asunaPackage = require(asunaPackagePath);
  // console.log('[x] app dependencies is', appPackage.dependencies);
  // console.log('[x] asuna dependencies is', asunaPackage.dependencies);

  const mergedDependencies = Object.assign(
    asunaPackage.dependencies,
    R.omit(['asuna-admin'], appPackage.dependencies),
  );
  // console.log('[x] merged dependencies is', mergedDependencies);
  if (!R.equals(mergedDependencies, asunaPackage.dependencies)) {
    console.log('[x] packages has difference...');
    fs.writeFileSync(distPackagePath, { ...asunaPackage, dependencies: mergedDependencies });
    console.log('[x] dependencies merged.');
  }
}

// --------------------------------------------------------------
// Program
// --------------------------------------------------------------

program
  .version('0.1.0');

program
  .command('docker')
  .option('-d, --dev', 'build in dev mode')
  .option('-b, --build-arg [value]', 'to set REGISTRY, e.g: --build-arg REGISTRY=...')
  .description('build docker image')
  .action((options) => {
    console.log('[x] build docker image');
    console.log('[x] build arg:', options.buildArg);
    console.log('[x] build dev mode:', options.dev);

    const appPath   = process.env.PWD;
    const asunaPath = path.join(__dirname, '../');
    const asunaDist = path.join(appPath, '.asuna/');
    console.log('[x] appPath is `%s`', appPath);
    console.log('[x] asunaPath is `%s`', asunaPath);

    async.auto({
      refresh: (callback) => {
        console.log('[x] refresh dependencies ...');
        shell.exec(`cd ${appPath} && yarn`);
        callback();
      },
      clean  : (callback) => {
        console.log('[x] clean .asuna ...');
        rimraf(asunaDist, () => { callback(); });
      },
      init   : ['clean', (results, callback) => {
        spawn.sync('mkdir', [asunaDist]);
        callback();
      }],
      sync   : ['refresh', 'init', (results, callback) => {
        console.log('[x] sync .asuna ...');
        console.log('[x] sync .asuna ...');
        Promise.all([
          new Promise((resolve, reject) => {
            console.log('[x] sync [dependencies] -> start');
            console.log('[x] sync [dependencies] -> cp',
              colors.yellow(asunaPath), 'to', colors.yellow(asunaDist));
            ncp(asunaPath, asunaDist, {
              filter: (filename) => {
                const isIgnored = /.+\/asuna-admin\/(node_modules|.git|.next|.idea|.asuna).+/.test(filename);
                // console.log({ filename, isIgnored, isInnerNodeModule })
                if (!isIgnored) {
                  console.log('D++>', colors.green(filename));
                }
                return !isIgnored;
              },
            }, (err) => {
              if (err) {
                console.error(colors.red('[x] sync [dependencies] -> error'), err);
                reject(err);
              }
              console.log('[x] sync [dependencies] -> success');
              resolve();
            });
          }),
          new Promise((resolve, reject) => {
            console.log('[x] sync [services] -> start');
            const source = path.join(appPath, 'services');
            const dest   = path.join(appPath, '.asuna/services');
            console.log('[x] sync [services] -> cp',
              colors.yellow(source), 'to', colors.yellow(dest));
            ncp(source, dest, {
              filter: (filename) => {
                console.log('S++>', colors.green(filename));
                return true;
              },
            }, (err) => {
              if (err) {
                console.error(colors.red('[x] sync [services] -> error'), err);
                reject(err);
              }
              console.log('[x] sync [services] -> success');
              resolve();
            });
          }),
        ]).then(() => {
          console.log('[x] sync .asuna done');
          callback();
        }).catch((err) => {
          callback(err);
        });
      }],
    }, (err) => {
      if (err) {
        console.error(colors.red('[x] run sync error'), err);
      } else {
        console.log('[x] merge dependencies ...');
        mergeDependencies();
        console.log('[x] try build image ...');
        buildImage(options.buildArg, options.dev);
      }
    });
  });

program
  .command('dev')
  .description('run server as dev mode')
  .action(() => {
    console.log('[x] run server in `%s` mode.', colors.green('dev'));
    const asunaRoot = path.join(__dirname, '../server.js');
    console.log('[x] %s', asunaRoot);
    startProcess();
  });

program
  .command('env')
  .description('generate .env.example in current folder')
  .action(() => {
    shell.cp(path.join(__dirname, '../.env.example'), process.env.PWD);
  });

if (!process.argv.slice(2).length) {
  program.outputHelp(txt => colors.red(txt));
}

program.parse(process.argv);
