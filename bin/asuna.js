#!/usr/bin/env node

const path    = require('path');
const spawn   = require('cross-spawn');
const program = require('commander');
const colors  = require('colors');
const { ncp } = require('ncp');
const Promise = require('bluebird');

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
    stdio: 'inherit', customFds: [0, 1, 2],
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
  .description('run server in docker.')
  .action(() => {
    console.log('[x] run server in docker.');
    const appPath   = process.env.PWD;
    const asunaPath = path.join(__dirname, '../');
    console.log('[x] appPath is `%s`', appPath);
    console.log('[x] asunaPath is `%s`', asunaPath);
    console.log('[x] sync .asuna ...');
    spawn('mkdir', [path.join(appPath, '.asuna')], { stdio: 'inherit', customFds: [0, 1, 2] });

    Promise.all([
      new Promise((resolve, reject) => {
        console.log('[x] sync [dependencies] -> start');
        try {
          ncp(asunaPath, path.join(appPath, '.asuna'), {
            filter: (filename) => {
              const test = /.*asuna-admin\/(node_modules|.git|.next|.idea).*/.test(filename);
              if (!test) {
                console.log('-->', filename, test);
              }
              return !test;
            },
            clobber: false,
          }, (err) => {
            if (err) {
              console.log('[x] sync [dependencies] -> error', err);
              reject(err);
            }
            console.log('[x] sync [dependencies] -> success');
            resolve();
          });
        } catch (e) {
          console.log('error here...');
        }
      }),
      new Promise((resolve, reject) => {
        console.log('[x] sync [services] -> start');
        ncp(path.join(appPath, 'services'), path.join(appPath, '.asuna/services'), (err) => {
          if (err) {
            console.log('[x] sync [services] -> error', err);
            reject(err);
          }
          console.log('[x] sync [services] -> success');
          resolve();
        });
      }),
    ])
      .then(() => {
        console.log('[x] try build image ...');
        buildImage();
      })
      .catch((err) => {
        console.log('error', err);
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

if (!process.argv.slice(2).length) {
  program.outputHelp(txt => colors.red(txt));
}

program.parse(process.argv);
