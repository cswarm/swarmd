/**
 * ExpressJS Routes.
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 1.0.0.
 * @license MIT
 **/

const express = require('express');
const fs      = require('fs');
const async   = require('async');
const path    = require('path');
//const arango  = require('arangojs');

// middleware
const morgan = require('morgan');
const bodyP  = require('body-parser');

module.exports = (dbctl, log, stage) => {
  'use strict';

  if(process.argv[2] === '--test-express') {
    throw 'ERROR'
  }

  // load our config or die.
  let config;
  try {
    config  = require('./config/config.json')
  } catch(e) {
    config  = require('./config/config.example.json');
  }

  const API_VERSION = config.server.api_version;

  let app = express();

  // middleware.
  app.use(morgan('dev'));
  app.use(bodyP.json());

  log('middleware loaded')

  async.waterfall([
    /**
     * Load Express Routes
     **/
    function(next) {
      let ROUTES = path.join(__dirname, 'routes', API_VERSION);
      fs.readdir(ROUTES, (err, list) => {
        if(err) {
          return next(err);
        }

        async.each(list, function(route, next) {
          let Path  = path.join(ROUTES, route);
          let name  = path.parse(route).name;
          let mount = path.join('/', API_VERSION, '/', name)

          log('mount route', name, 'on', mount);

          let eroute;
          try {
            eroute = require(Path);
          } catch(e) {
            return next(e);
          }

          // execute eroute "constructor"
          let router = eroute(new express.Router(), dbctl, function() {
            let args = Array.prototype.slice.call(arguments, 0);
            args[0]  = 'main: '+stage.Sub+ ' stage '+ stage.Stage + ' ('+mount+'): ' + args[0];
            console.log.apply(console, args);
          });

          // Hook in the newly created route.
          app.use(mount, router);

          app.get('/'+API_VERSION, function(req, res) {
            res.send('')
          });

          return next()
        }, function(err) {
          if(err) {
            return next(err);
          }

          return next();
        });
      })
    }
  ], err => {
    if(err) {
      throw err;
    }

    stage.emit('finished', {
      stage: 1,
      sub: 'INIT',
      name: 'express::construct'
    });

    stage.emit('start', {
      stage: 2,
      name: 'express::start',
      sub: 'INIT'
    })

    app.listen(config.server.port, function() {
      log('express listening on', config.server.port);
      stage.emit('finished', {
        stage: 2,
        name: 'express::start',
        sub: 'INIT'
      })
    });
  });
}
