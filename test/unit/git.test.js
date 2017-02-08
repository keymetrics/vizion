var expect = require('chai').expect;
var fs = require('fs');
var sinon = require('sinon');
var ini = require('ini');

var git = require("../../lib/git/git.js");


describe('Unit: git', function () {

  describe('parseGitConfig', function parseGitConfigTest() {
    var folder = "my-folder";
    var config = {stub: 'config'};
    var data = {stub: 'data'};
    var readFileStub, parseStub;

    before(function beforeTest() {
      readFileStub = sinon.stub(fs, 'readFile', function (path, encoding, cb) {
        expect(path).to.eq('my-folder/.git/config');

        cb(null, data);
      });

      parseStub = sinon.stub(ini, 'parse', function (myData) {
        expect(myData).to.eq(data);

        return config;
      });
    });

    it('ok', function it(done) {
      git.parseGitConfig(folder, function (err, myConfig) {
        if (err) {
          return done(err);
        }

        expect(myConfig).to.eq(config);
        done();
      })
    });

    after(function afterTest() {
      readFileStub.restore();
      parseStub.restore();
    });
  });

  describe('getUrl', function getUrlTest() {
    var folder = "my-folder";
    var config = {
      'remote "origin"': {
        url: 'test-url'
      }
    };
    var parseGitConfigStub;

    before(function beforeTest() {
      parseGitConfigStub = sinon.stub(git, 'parseGitConfig', function (myFolder, cb) {
        expect(myFolder).to.eq(folder);

        cb(null, config);
      });
    });

    it('ok', function it(done) {
      git.getUrl(folder, function (err, data) {
        if (err) {
          return done(err);
        }

        expect(data).to.deep.eq({
          "type": "git",
          "url": "test-url"
        });
        done();
      });
    });

    after(function afterTest() {
      parseGitConfigStub.restore();
    });
  });

});