require('dotenv').load();

var request = require('supertest');
var chai = require('chai');
chai.use(require('chai3-json-schema'));
var assert = chai.assert;

var app = require('../app.js');

var eventsResponseSchema = require('./events-response-schema');

describe('time api', function() {
  it('should respond with a time string', function(done) {
    request(app)
      .get('/api/time')
      .expect(200)
      .expect(function(res) {
        console.log(res.body.time);
        assert.match(res.body.time, /^\d{1,2}:\d\d ?([ap]m)?$/i);
      })
      .end(done);
  });
});

describe('events api', function() {
  it('should respond with a list of events', function(done) {
    request(app)
      .get('/api/events')
      .expect(200)
      .expect(function(res) {
        assert.jsonSchema(res.body, eventsResponseSchema);
      })
      .end(done);
  });
});
