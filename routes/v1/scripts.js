/**
 * /scripts route, handles workers.
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 1.0.0.
 * @license MIT
 **/

'use strict';

const kue      = require('kue');

module.exports = (Router, dbctl, log) => {

  log('start kue');
  let queue = kue.createQueue();

  /**
   * POST /execute
   *
   * Execute a project on a router.
   **/
  Router.post('/execute', (req, res) => {
    res.send({
      success: true
    });
  });

  /**
   * POST /create
   *
   * Setup a new project to be managed by swarm workers.
   **/
  Router.post('/create', (req, res) => {
    let data = req.body;

    if(!data.git) {
      return res.send({
        success: false,
        reason: 'Invalid Request.'
      })
    }

    let job = queue.create('newProject', {
      git: data.git
    }).save(err => {
      res.send({
        success: err || true,
        jobId: job.id
      });
    });
  });

  return Router;
}
