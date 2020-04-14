var expect = require('chai').expect;
var fs = require('fs');
var sinon = require('sinon');
var ini = require('ini');

var git = require("../../lib/git/git");
var jsGitService = require("../../lib/git/js-git-service");


describe('Unit: git', function () {

  describe('parseGitConfig', function parseGitConfigTest() {
    var folder = "my-folder";
    var config = {stub: 'config'};
    var data = {stub: 'data'};
    var readFileStub, parseStub;

    before(function beforeTest() {
      readFileStub = sinon.stub(fs, 'readFile').callsFake(function (path, encoding, cb) {
        if (process.platform !== 'win32' && process.platform !== 'win64')
          expect(path).to.eq('my-folder/.git/config');
        else
          expect(path).to.eq('my-folder\\.git\\config');

        cb(null, data);
      });

      parseStub = sinon.stub(ini, 'parse').callsFake(async function (myData) {
        expect(myData).to.eq(data);

        return config;
      });
    });

    it('ok', async function it() {
      const myConfig = await git.parseGitConfig(folder);
      expect(myConfig).to.eq(config);
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
      parseGitConfigStub = sinon.stub(git, 'parseGitConfig').callsFake(async function (myFolder) {
        expect(myFolder).to.eq(folder);
        return config;
      });
    });

    it('ok', async function it() {
      const data = await git.getUrl(folder);
      expect(data).to.deep.eq({
        "type": "git",
        "url": "test-url"
      });
    });

    after(function afterTest() {
      parseGitConfigStub.restore();
    });
  });


  describe('getCommitInfo', function getCommitInfoTest() {
    var folder = "my-folder";
    var commit = {
      hash: 'xfd4560',
      message: 'my message'
    };
    var data = {};
    var getHeadCommitStub;

    before(function beforeTest() {
      getHeadCommitStub = sinon.stub(jsGitService, 'getHeadCommit').callsFake(function (myFolder, cb) {
        expect(myFolder).to.eq(folder);

        cb(null, commit);
      });
    });

    it('ok', async function it() {
      data = await git.getCommitInfo(folder, data);
      expect(data).to.deep.eq({
        "revision": commit.hash,
        "comment": commit.message
      });
    });

    after(function afterTest() {
      getHeadCommitStub.restore();
    });
  });

  describe('getBranch', function getBranchTest() {
    var folder = "my-folder";
    var data = {};
    var readFileStub;

    before(function beforeTest() {
      readFileStub = sinon.stub(fs, 'readFile').callsFake(function (path, encoding, cb) {
        if (process.platform !== 'win32' && process.platform !== 'win64')
            expect(path).to.eq('my-folder/.git/HEAD');
        else
            expect(path).to.eq('my-folder\\.git\\HEAD');
        expect(encoding).to.eq('utf-8');

        cb(null, "ref: refs/heads/master");
      });
    });

    it('ok', async function it() {
      data = await git.getBranch(folder, data);
      expect(data).to.deep.eq({
        "branch": "master",
      });
    });

    after(function afterTest() {
      readFileStub.restore();
    });
  });

  describe('getRemote', function getRemoteTest() {
    var folder = "my-folder";
    var config = {
      'remote "origin"': {
        url: 'test-url'
      },
      'remote "other"': {
        url: 'other-url'
      }
    };
    var data = {};
    var parseGitConfigStub;

    before(function beforeTest() {
      parseGitConfigStub = sinon.stub(git, 'parseGitConfig').callsFake(async function (myFolder) {
        expect(myFolder).to.eq(folder);
        return config;
      });
    });

    it('ok', async function it() {
      data = await git.getRemote(folder, data);
      expect(data).to.deep.eq({
        "remote": "origin",
        "remotes": [
          "origin",
          "other"
        ]
      });
    });

    after(function afterTest() {
      parseGitConfigStub.restore();
    });
  });


  describe('isCurrentBranchOnRemote', function isCurrentBranchOnRemoteTest() {
    var folder = "my-folder";
    var data = {
      branch: 'my-branch',
      remote: 'my-remote'
    };
    var getRefHashStub;

    context('not on remote', function () {
      before(function beforeTest() {
        getRefHashStub = sinon.stub(jsGitService, 'getRefHash').callsFake(function (myFolder,myBranch,myRemote, cb) {
          expect(myFolder).to.eq(folder);
          expect(myBranch).to.eq(data.branch);
          expect(myRemote).to.eq(data.remote);

          cb(null, null);
        });
      });

      it('ok', async function it() {
        data = await git.isCurrentBranchOnRemote(folder, data);
        expect(data).to.deep.eq({
          "branch": "my-branch",
          "branch_exists_on_remote": false,
          "remote": "my-remote"
        });
      });

      after(function afterTest() {
        getRefHashStub.restore();
      });
    });

    context('on remote', function () {
      before(function beforeTest() {
        getRefHashStub = sinon.stub(jsGitService, 'getRefHash').callsFake(function (myFolder,myBranch,myRemote, cb) {
          expect(myFolder).to.eq(folder);
          expect(myBranch).to.eq(data.branch);
          expect(myRemote).to.eq(data.remote);

          cb(null, "FX421345CX");
        });
      });

      it('ok', async function it() {
        data = await git.isCurrentBranchOnRemote(folder, data);
        expect(data).to.deep.eq({
          "branch": "my-branch",
          "branch_exists_on_remote": true,
          "remote": "my-remote"
        });
      });

      after(function afterTest() {
        getRefHashStub.restore();
      });
    });

  });

  describe('getPrevNext', function getPrevNextTest() {
    var folder = "my-folder";
    var data = {
      branch_exists_on_remote:true,
      branch: 'my-branch',
      remote: 'my-remote',
      revision: '2'
    };
    var commitHistory = [
      {hash: '3'},
      {hash: '2'},
      {hash: '1'},
    ];
    var getCommitHistoryStub;

    before(function beforeTest() {
      getCommitHistoryStub = sinon.stub(jsGitService, 'getCommitHistory').callsFake(function (myFolder, n, myBranch, myRemote, cb) {
        expect(myFolder).to.eq(folder);
        expect(n).to.eq(100);
        expect(myBranch).to.eq(data.branch);
        expect(myRemote).to.eq(data.remote);

        cb(null, commitHistory);
      });
    });

    it('ok', async function it() {
      data = await git.getPrevNext(folder, data);
      expect(data).to.deep.eq({
        "ahead": false,
        "branch": "my-branch",
        "branch_exists_on_remote": true,
        "next_rev": "3",
        "prev_rev": "1",
        "remote": "my-remote",
        "revision": "2"
      });
    });

    after(function afterTest() {
      getCommitHistoryStub.restore();
    });
  });

});
