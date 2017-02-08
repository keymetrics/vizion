var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;
var ini = require('ini');
var path = require('path');
var _ = require('lodash');
var helper = require('../helper.js');
var jsGitService = require('./js-git-service.js');

var git = {};

var TIMEOUT = 5000;
var MAXBUFFER = 1024 * 64; // 16KB

git.parseGitConfig = function (folder, cb) {
  fs.readFile(path.join(folder, '.git/config'), 'utf-8', function (err, data) {
    if (err) {
      return cb(err);
    }

    var config = ini.parse(data);
    cb(null, config);
  });
};

git.getUrl = function (folder, cb) {
  git.parseGitConfig(folder, function (err, config) {
    if (err) {
      return cb(err);
    }

    var data = {};

    data.type = 'git';
    data.url = _.get(config, 'remote "origin".url');

    cb(null, data);
  });
};

git.getMeta = function (folder, data, cb) {
  jsGitService.getHeadCommit(folder, function (err, commit) {
    if (err) {
      return cb(err);
    }

    data.revision = commit.hash;
    data.comment = commit.message;
    cb(null, data);
  });
};

git.getStaged = function (folder, data, cb) {
  exec("cd '" + folder + "';LC_ALL=en_US.UTF-8 git status -s", {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
    function (err, stdout, stderr) {
      if (err) {
        return cb(err);
      }

      data.unstaged = (stdout === '') ? false : true;
      return cb(null, data);
    });
};

git.getBranch = function (folder, data, cb) {
  exec("cd '" + folder + "';LC_ALL=en_US.UTF-8 git rev-parse --abbrev-ref HEAD", {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
    function (err, stdout, stderr) {
      if (err) {
        return cb(err);
      }

      data.branch = helper.trimNewLine(stdout);
      return cb(null, data);
    });
};


git.getRemote = function (folder, data, cb) {
  exec("cd '" + folder + "';LC_ALL=en_US.UTF-8 git remote", {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
    function (err, stdout, stderr) {
      if (err) {
        return cb(err);
      }

      data.remotes = stdout.split('\n');
      data.remotes.pop();
      data.remote = (data.remotes.indexOf('origin') === -1) ? data.remotes[0] : 'origin';
      return cb(null, data);
    });
};

git.getRemoteBrancheExistence = function (folder, data, cb) {
  exec("cd '" + folder + "';LC_ALL=en_US.UTF-8 git show-ref refs/remotes/" + data.remote + "/" + data.branch, {
      timeout: TIMEOUT,
      maxBuffer: MAXBUFFER
    },
    function (err, stdout, stderr) {
      if (err) {
        data.branch_exists_on_remote = false;
      }
      else {
        data.branch_exists_on_remote = true;
      }

      return cb(null, data);
    });
};

git.getPrevNext = function (folder, data, cb) {
  var prefix = '';

  if (data.branch_exists_on_remote)
    prefix = data.remote + '/';

  exec("cd '" + folder + "';LC_ALL=en_US.UTF-8 git log " + prefix + data.branch + " --pretty=oneline -n 100", {
      timeout: TIMEOUT,
      maxBuffer: MAXBUFFER
    },
    function (err, stdout, stderr) {
      if (err) {
        return cb(err);
      }

      var commit_history = [];
      var lines = stdout.split('\n');

      lines.forEach(function (key) {
        var parse = key.match(/([^ ]*) (.*)/);
        if (parse)
          commit_history.push(parse[1]);
      });

      var current = commit_history.indexOf(data.revision);
      data.ahead = false;
      data.next_rev = null;
      data.prev_rev = null;
      if (current === -1) {
        data.ahead = true;
      }
      else {
        data.next_rev = (current === 0) ? null : commit_history[current - 1];
        data.prev_rev = (current === (commit_history.length - 1)) ? null : commit_history[current + 1];
      }
      return cb(null, data);
    });
};


git.getDate = function (folder, data, cb) {
  fs.stat(folder + ".git", function (err, stats) {
    if (err) {
      return cb(err);
    }

    data.update_time = helper.trimNewLine(stats.mtime);
    return cb(null, data);
  });
};

git.getTags = function (folder, data, cb) {
  exec("cd '" + folder + "';LC_ALL=en_US.UTF-8 git tag", {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
    function (err, stdout, stderr) {
      if (err) {
        return cb(err);
      }

      if (stdout.length) {
        data.tags = stdout.split('\n');
        data.tags.pop();
        data.tags = data.tags.slice(0, 10);
      }
      return cb(null, data);
    });
};

git.parse = function (folder, cb) {
  async.waterfall([
      git.getUrl.bind(null, folder),
      git.getMeta.bind(null, folder),
      git.getStaged.bind(null, folder),
      git.getBranch.bind(null, folder),
      git.getRemote.bind(null, folder),
      git.getRemoteBrancheExistence.bind(null, folder),
      git.getPrevNext.bind(null, folder),
      git.getDate.bind(null, folder),
      git.getTags.bind(null, folder)],
    function (err, data) {
      if (err) {
        return cb(err);
      }

      return cb(null, data);
    });
};

git.isUpdated = function (folder, cb) {
  git.parse(folder, function (err, data) {
    if (err) {
      return cb(err);
    }

    var prefix = '';

    if (data.branch_exists_on_remote)
      prefix = data.remote + '/';

    exec("cd '" + folder + "';LC_ALL=en_US.UTF-8 git remote update >> /dev/null 2>&1; git log " + prefix + data.branch +
      " --pretty=oneline -n 1", {timeout: 60000, maxBuffer: MAXBUFFER},
      function (err, stdout, stderr) {
        if (err) {
          return cb(err);
        }

        var res = {};

        if (stdout.substring(0, 40) === data.revision.substring(0, 40))
          res.is_up_to_date = true;
        else
          res.is_up_to_date = false;
        res.new_revision = stdout.substring(0, 40);
        res.current_revision = data.revision.substring(0, 40);
        return cb(null, res);
      });
  });
};

git.revert = function (args, cb) {
  var ret = {};
  var command = "cd '" + args.folder + "';LC_ALL=en_US.UTF-8 git reset --hard " + args.revision;
  ret.output = '';
  ret.output += command + '\n';
  ret.success = true;
  exec(command, {timeout: TIMEOUT, maxBuffer: MAXBUFFER},
    function (err, stdout, stderr) {
      ret.output += stdout;
      if (err !== null || stderr.substring(0, 6) === 'fatal:')
        ret.success = false;
      return cb(null, ret);
    });
};

git.update = function (folder, cb) {
  git.isUpdated(folder, function (err, data) {
    if (err) {
      return cb(err);
    }

    var res = {};
    if (data.is_up_to_date === true) {
      res.success = false;
      res.current_revision = data.new_revision;
      return cb(null, res);
    }
    else {
      git.revert({folder: folder, revision: data.new_revision},
        function (err, dt) {
          if (err) {
            return cb(err);
          }

          res.output = dt.output;
          res.success = dt.success;
          res.current_revision = (dt.success) ? data.new_revision : data.current_revision;
          return cb(null, res);
        });
    }
  });
};

git.prev = function (folder, cb) {
  git.parse(folder, function (err, data) {
    if (err) {
      return cb(err);
    }

    var res = {};
    if (data.prev_rev !== null) {
      git.revert({folder: folder, revision: data.prev_rev}, function (err, meta) {
        if (err !== null)
          return cb(err);
        res.output = meta.output;
        res.success = meta.success;
        res.current_revision = (res.success) ? data.prev_rev : data.revision;
        return cb(null, res);
      });
    }
    else {
      res.success = false;
      res.current_revision = data.revision;
      return cb(null, res);
    }
  });
};

git.next = function (folder, cb) {
  git.parse(folder, function (err, data) {
    if (err) {
      return cb(err);
    }

    var res = {};
    if (data.next_rev !== null) {
      git.revert({folder: folder, revision: data.next_rev}, function (err, meta) {
        if (err) {
          return cb(err);
        }

        res.output = meta.output;
        res.success = meta.success;
        res.current_revision = (res.success) ? data.next_rev : data.revision;
        return cb(null, res);
      });
    }
    else {
      res.success = false;
      res.current_revision = data.revision;
      return cb(null, res);
    }
  });
};

module.exports = git;