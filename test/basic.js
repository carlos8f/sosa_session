describe('basic test', function () {
  var server, base, currentId;
  before(function (done) {
    server = require('http').createServer();
    middler(server)
      .first(sess())
      .first(['post', 'put'], function bodyParser (req, res, next) {
        var buf = '';
        req.on('data', function (data) {
          buf += data;
        });
        req.once('end', function () {
          try {
            var body = JSON.parse(buf);
          }
          catch (e) {
            return next(e);
          }
          req.body = body;
          next();
        });
        req.resume();
      })
      .first(expres.middleware)
      .post('/session', function (req, res, next) {
        Object.keys(req.body).forEach(function (k) {
          req.session[k] = req.body[k];
        });
        res.json(req.session);
      })
      .get('/session', function (req, res, next) {
        res.json(req.session);
      })
      .delete('/session', function (req, res, next) {
        req.session.destroy(function (err) {
          if (err) return next(err);
          res.send(201);
        });
      })
      .last(function (req, res, next) {
        res.send(404);
      });

    server.listen(0, function () {
      base = 'http://localhost:' + server.address().port;
      done();
    });
  });
  it('has session', function (done) {
    request({uri: base + '/session', json: true}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(resp.statusCode, 200);
      assert(body.id);
      currentId = body.id;
      assert(body.created);
      done();
    });
  });
  it('is persistent', function (done) {
    request({uri: base + '/session', json: true}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(resp.statusCode, 200);
      assert(body.id);
      assert.equal(body.id, currentId);
      assert(body.created);
      done();
    });
  });
  it('sets session', function (done) {
    var vars = {a: 'ok', its: {working: true}, ok: 1};
    request({uri: base + '/session', method: 'post', json: true, body: vars}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(resp.statusCode, 200);
      done();
    });
  });
  it('is persistent', function (done) {
    request({uri: base + '/session', json: true}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(resp.statusCode, 200);
      assert(body.id);
      assert.equal(body.id, currentId);
      assert.equal(body.a, 'ok');
      assert.deepEqual(body.its, {working: true});
      assert.strictEqual(body.ok, 1);
      done();
    });
  });
});
