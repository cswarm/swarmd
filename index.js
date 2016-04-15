/**
 * Verteilt - a Distrubted Status sharing service
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 0.1.0
 * @license MIT
 **/

'use strict';

const arango  = require('arangojs');
const async   = require('async');

// our modules.
const log     = require('./lib/log.js');
const stage   = require('./lib/stage.js');

// load our config or die.
let config;
try {
  config  = require('./config/config.json')
} catch(e) {
  config  = require('./config/config.example.json');
  console.log('Using Example Config. This is not a good idea.');
}

// STATIC
const DBNAME = config.db.name;
const DBHOST = config.db.host;
const DBUSER = config.db.username;
const DBPASS = config.db.password;
// const PORT   = config.server.port;

let dbctl    = new arango({
  url: DBHOST
});

let init = () => {
  stage.emit('start', {
    stage: 1,
    name: 'express',
    sub: 'INIT'
  })

  try {
    require('./express.js')(dbctl, function() {
      let args = Array.prototype.slice.call(arguments, 0);
      args[0]  = 'main: '+stage.Sub+ ' stage '+ stage.Stage + ': ' + args[0];
      console.log.apply(console, args);
    }, stage);
  } catch(err) {
    if(err === 'ERROR') {
      process.exit(2);
    }

    stage.emit('failed', {
      stage: stage.Stage,
      sub: stage.Sub,
      name: stage.Name
    });
  }
}

// Init Stage.
stage.on('init', () => {
  log('INIT stage started.')
  return init();
})

return stage.emit('init');
