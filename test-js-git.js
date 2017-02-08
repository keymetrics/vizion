var path = require('path');

// Create a repo object
var repo = {};
// Mixin the base DB operations using local git database on disk.
require('git-node-fs/mixins/fs-db')(repo, "/tmp/angular-bridge/.git");
// Mixin the walker helpers.
require('js-git/mixins/walkers')(repo);

// Look up the hash that master currently points to.
// HEAD for local head
// refs/remotes/origin/HEAD for remote head
repo.readRef("HEAD", function (err, commitHash) {
  if (err) {
    return console.log(err);
  }

  repo.logWalk(commitHash.replace(/ref: /g,""), function (err, logStream) {
    if (err) {
      return console.log(err);
    }

    logStream.read(function (err, commit) {
      if (err) {
        return console.log(err);
      }

      console.log(commit);
    });


  });
});

