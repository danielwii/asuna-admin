#!/usr/bin/env node
/* eslint-disable no-console */

const path    = require('path');
const spawn   = require('cross-spawn');
const program = require('commander');
const colors  = require('colors');
const async   = require('async');
const rimraf  = require('rimraf');
const { ncp } = require('ncp');
const shell   = require('shelljs');

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

function buildImage() {
  console.log('[x] buildImage asuna-admin...');
  const asunaBuildPath = path.join(process.env.PWD, '.asuna');
  const proc           = spawn('docker', ['build', '-t', 'asuna-admin', asunaBuildPath], {
    stdio: 'inherit',
  });
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

// --------------------------------------------------------------
// Program
// --------------------------------------------------------------

program
  .version('0.1.0');

program
  .command('docker')
  .description('build docker image')
  .action(() => {
    console.log('[x] build docker image');

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
        Promise.all([
          new Promise((resolve, reject) => {
            console.log('[x] sync [dependencies] -> start');
            console.log('[x] sync [dependencies] -> cp',
              colors.yellow(asunaPath), 'to', colors.yellow(asunaDist));
            ncp(asunaPath, asunaDist, {
              filter: (filename) => {
                const test = /.*asuna-admin\/(node_modules|.git|.next|.idea|.asuna).*/.test(filename);
                if (!test) {
                  console.log('D++>', colors.green(filename));
                }
                return !test;
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
          callback();
        }).catch((err) => {
          callback(err);
        });
      }],
    }, (err) => {
      if (err) {
        console.error(colors.red('[x] run sync error'), err);
      } else {
        console.log('[x] try build image ...');
        buildImage();
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
