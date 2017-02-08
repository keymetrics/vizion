var path = require('path');

var jsGitService = {};

jsGitService.loadRepo = function (folder) {
  var repo = {};
  // Mixin the base DB operations using local git database on disk.
  require('git-node-fs/mixins/fs-db')(repo, path.join(folder,'.git'));
  // Mixin the walker helpers.
  require('js-git/mixins/walkers')(repo);

  return repo;
};

jsGitService.getHeadCommit = function (folder, remote, cb) {
  if (cb === undefined) {
    cb = remote;
    remote = null;
  }

  var repo = jsGitService.loadRepo(folder);

  // Look up the hash that master currently points to.
  // HEAD for local head
  // refs/remotes/origin/HEAD for remote head
  repo.readRef(remote ? `refs/remotes/${remote}/HEAD` : "HEAD", function (err, commitHash) {
    if (err) {
      return cb(err);
    }
    if (!commitHash) {
      return cb(null,{});
    }

    repo.logWalk(commitHash.replace(/ref: /g, ""), function (err, logStream) {
      if (err) {
        return cb(err);
      }
      if (!logStream) {
        return cb(null,{});
      }

      logStream.read(function (err, commit) {
        if (err) {
          return cb(err);
        }

        cb(null, commit || {});
      });
    });
  });
};


module.exports = jsGitService;
