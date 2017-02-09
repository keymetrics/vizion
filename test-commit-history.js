var jsGitService = require('./lib/git/js-git-service');
var _ = require('lodash');

jsGitService.getCommitHistory('/home/didil/work/projects/node/hourwiseApp', 20, 'master', function (err, commitHistory) {
  if (err) {
    return console.log(err);
  }

  console.log(_.map(commitHistory, (commit)=> commit.hash));
});