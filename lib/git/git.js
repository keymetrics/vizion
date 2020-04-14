var fs = require('fs');
var exec = require('child_process').exec;
var ini = require('ini');
var path = require('path');
var helper = require('../helper.js');
var cliCommand = require('../cliCommand.js');
var jsGitService = require('./js-git-service.js');

var git = {};

var TIMEOUT = 5000;
var MAXBUFFER = 1024 * 64; // 16KB

git.parseGitConfig = async function (folder) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(folder, '.git/config'), 'utf-8', function (err, data) {
      if (err) {
        return reject(err);
      }

      var config = ini.parse(data);
      resolve(config);
    });
  });
};

git.getUrl = async function (folder) {
  const config = await git.parseGitConfig(folder);
  var data = {};
  data.type = 'git';
  data.url = helper.get(config, 'remote "origin".url');
  return data;
};

git.getCommitInfo = function (folder, data) {
  return new Promise((resolve, reject) => {
    jsGitService.getHeadCommit(folder, function (err, commit) {
      if (err) {
        return reject(err);
      }

      data.revision = helper.get(commit, 'hash');
      data.comment = helper.get(commit, 'message');
      resolve(data);
    });
  });
};

git.getStaged = function (folder, data) {
  return new Promise((resolve, reject) => {
    exec(cliCommand(folder, 'git status -s'), {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
      function (err, stdout, stderr) {
        if (err) {
          return reject(err);
        }

        data.unstaged = (stdout === '') ? false : true;
        return resolve(data);
      });
  });
};

git.getBranch = function (folder, data) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(folder, '.git/HEAD'), 'utf-8', function (err, content) {
      if (err) {
        return reject(err);
      }

      var regex = /ref: refs\/heads\/(.*)/;
      var match = regex.exec(content);
      data.branch = match ? match[1] : 'HEAD';

      return resolve(data);
    });
  });
};


git.getRemote = async function (folder, data) {
  const config = await git.parseGitConfig(folder);

  data.remotes = [];

  Object.keys(config).map(function (key) {
    var regex = /remote "(.*)"/;
    var match = regex.exec(key);
    if (match) {
      data.remotes.push(match[1]);
    }
  });

  data.remote = (data.remotes.indexOf('origin') === -1) ? data.remotes[0] : 'origin';

  return data;
};

git.isCurrentBranchOnRemote = function (folder, data) {
  return new Promise((resolve, reject) => {
    jsGitService.getRefHash(folder, data.branch, data.remote, function (err, hash) {
      if (err) {
        return reject(err);
      }

      data.branch_exists_on_remote = !!hash;

      return resolve(data);
    });
  });
};

git.getPrevNext = function (folder, data) {
  return new Promise((resolve, reject) => {
    var remote = data.branch_exists_on_remote ? data.remote : null;

    jsGitService.getCommitHistory(folder, 100, data.branch, remote, function (err, commitHistory) {
      if (err) {
        return reject(err);
      }

      var currentCommitIndex = commitHistory.findIndex(({ hash }) => hash === data.revision);

      if (currentCommitIndex === -1) {
        data.ahead = true;
        data.next_rev = null;
        data.prev_rev = null;
      }
      else {
        data.ahead = false;
        data.next_rev = (currentCommitIndex === 0) ? null : commitHistory[currentCommitIndex - 1].hash;
        data.prev_rev = (currentCommitIndex === (commitHistory.length - 1)) ? null : commitHistory[currentCommitIndex + 1].hash;
      }

      resolve(data);
    });
  });
};

git.getUpdateTime = function (folder, data) {
  return new Promise((resolve, reject) => {
    fs.stat(folder + ".git", function (err, stats) {
      if (err) {
        return reject(err);
      }

      data.update_time = helper.trimNewLine(stats.mtime);
      return resolve(data);
    });
  });
};

git.getTags = function (folder, data) {
  return new Promise((resolve, reject) => {
    exec(cliCommand(folder, 'git tag'), {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
      function (err, stdout, stderr) {
        if (err) {
          return reject(err);
        }

        if (stdout.length) {
          data.tags = stdout.split('\n');
          data.tags.pop();
          data.tags = data.tags.slice(0, 10);
        }
        return resolve(data);
      });
  });
};

git.parse = async function (folder) {
  let data = await git.getUrl(folder);
  data = await git.getCommitInfo(folder, data);
  data = await git.getStaged(folder, data);
  data = await git.getBranch(folder, data);
  data = await git.getRemote(folder, data);
  data = await git.isCurrentBranchOnRemote(folder, data);
  data = await git.getPrevNext(folder, data);
  data = await git.getUpdateTime(folder, data);
  data = await git.getTags(folder, data);
  return data;
};

git.isUpdated = async function (folder) {
  let data = await git.getCommitInfo(folder, {});
  data = await git.getBranch(folder, data);
  data = await git.getRemote(folder, data);
  data = await git.isCurrentBranchOnRemote(folder, data);
  return new Promise((resolve, reject) => {
    exec(cliCommand(folder, 'git remote update'), {timeout: 60000, maxBuffer: MAXBUFFER},
      function (err, stdout, stderr) {
        if (err) {
          return reject(err);
        }

        var remote = data.branch_exists_on_remote ? data.remote : null;
        jsGitService.getLastCommit(folder, data.branch, remote, function (err, commit) {
          if (err) {
            return reject(err);
          }

          var res = {
            new_revision: commit.hash,
            current_revision: data.revision,
            is_up_to_date: (commit.hash === data.revision)
          };
          return resolve(res);
        });
      });
  });
};

git.revert = async function (args) {
  var ret = {};
  var command = cliCommand(args.folder, "git reset --hard " + args.revision);
  ret.output = '';
  ret.output += command + '\n';
  ret.success = true;
  return new Promise(((resolve, reject) => {
    exec(command, {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
      function (err, stdout, stderr) {
        ret.output += stdout;
        if (err !== null || stderr.substring(0, 6) === 'fatal:')
          ret.success = false;
        return resolve(ret);
      });
  }));
};

git.update = async function (folder) {
  const data = await git.isUpdated(folder);
  var res = {};
  if (data.is_up_to_date === true) {
    res.success = false;
    res.current_revision = data.new_revision;
    return res;
  } else {
    const meta = await git.revert({folder: folder, revision: data.new_revision});
    res.output = meta.output;
    res.success = meta.success;
    res.current_revision = (meta.success) ? data.new_revision : data.current_revision;
    return res;
  }
};

git.prev = async function (folder) {
  let data = await git.getCommitInfo(folder, {});
  data = await git.getBranch(folder, data);
  data = await git.getRemote(folder, data);
  data = await git.isCurrentBranchOnRemote(folder, data);
  data = await git.getPrevNext(folder, data);

  var res = {};
  if (data.prev_rev !== null) {
    const meta = await git.revert({folder: folder, revision: data.prev_rev});
    res.output = meta.output;
    res.success = meta.success;
    res.current_revision = (res.success) ? data.prev_rev : data.revision;
    return res;
  } else {
    res.success = false;
    res.current_revision = data.revision;
    return res;
  }
};

git.next = async function (folder) {
  let data = await git.getCommitInfo(folder, {});
  data = await git.getBranch(folder, data);
  data = await git.getRemote(folder, data);
  data = await git.isCurrentBranchOnRemote(folder, data);
  data = await git.getPrevNext(folder, data);
  var res = {};
  if (data.next_rev !== null) {
    const meta = await git.revert({folder: folder, revision: data.next_rev});
    res.output = meta.output;
    res.success = meta.success;
    res.current_revision = (res.success) ? data.next_rev : data.revision;
    return res;
  }
  else {
    res.success = false;
    res.current_revision = data.revision;
    return res;
  }
};

module.exports = git;
