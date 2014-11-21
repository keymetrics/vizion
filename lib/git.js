var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;

var git = {};

git.parse = function(folder, cb) {
  var myTrim = function(str) {
    if (typeof(str) === 'string')
      return str.replace(/\n/g, '');
    return str;
  };

  var getUrl = function(cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 git config --get remote.origin.url", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var data = {};
      data.type = 'git';
      data.url = myTrim(stdout);
      return cb(null, data);
    });
  };

  var getMeta = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 git show --quiet --format=%H%n%aD%n%s%n%B HEAD", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var lines = stdout.split("\n");
      data.revision = myTrim(lines.shift());
      data.update_time = myTrim(lines.shift());
      data.comment = myTrim(lines.shift());
      return cb(null, data);
    });
  };

  var getStaged = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 git status -s", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      data.unstaged = (stdout === '') ? false : true;
      return cb(null, data);
    });
  };

  var getBranch = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 git rev-parse --abbrev-ref HEAD", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      data.branch = myTrim(stdout);
      return cb(null, data);
    });
  };

  var getRemote = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 git remote", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      data.remotes = stdout.split('\n');
      data.remotes.pop();
      data.remote = (data.remotes.indexOf('origin') === -1)
                    ? data.remotes[0] : 'origin';
      return cb(null, data);
    });
  };

  var getPrevNext = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 git log "+data.remote+"/"+data.branch+" --pretty=oneline",
    function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var commit_history = [];
      var lines = stdout.split('\n');

      lines.forEach(function(key) {
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

  var getDate = function(data, cb) {
    fs.stat(folder+".git", function(err, stats) {
      if(err !== null)
        return cb(err);
      data.update_time = myTrim(stats.mtime);
      return cb(null, data);
    });
  };

  async.waterfall([getUrl, getMeta, getStaged, getBranch, getRemote, getPrevNext, getDate],
  function(err, data) {
    if (err !== null)
      return cb(err);
    return cb(null, data);
  });
};

git.isUpdated = function(folder, cb) {
  git.parse(folder, function(err, data) {
    if (err !== null)
      return cb(err);
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 git remote update >> /dev/null 2>&1; git log "+data.remote
         +"/"+data.branch+" --pretty=oneline -n 1", function(err, stdout, stderr) {
           var res = {};

           if(err !== null)
             return cb(err);
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

git.revert = function(args, cb) {
  exec("cd '"+args.folder+"';LC_ALL=en_US.UTF-8 git reset --hard "+args.revision,
  function(err, stdout, stderr) {
    if (err !== null || stderr.substring(0, 6) === 'fatal:')
      return cb(null, {success: false});
    return cb(null, {success: true});
  });
};

git.update = function(folder, cb) {
  git.isUpdated(folder, function(err, data) {
    var res = {};
    if (err !== null)
      return cb(err);
    if (data.is_up_to_date === true) {
      res.success = false;
      res.current_revision = data.new_revision;
      return cb(null, res);
    }
    else {
      git.revert({folder: folder, revision: data.new_revision},
      function (err, dt) {
        if (err !== null)
          return cb(err);
        res.success = dt.success;
        res.current_revision = (dt.success) ? data.new_revision : data.current_revision;
        return cb(null, res);
      });
    }
  });
};

git.prev = function(folder, cb) {
  git.parse(folder, function(err, data) {
    if (err !== null)
      return cb(err);
    var res = {};
    if (data.prev_rev !== null) {
      git.revert({folder: folder, revision: data.prev_rev}, function(err, meta){
        if (err !== null)
          return cb(err);
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

git.next = function(folder, cb) {
  git.parse(folder, function(err, data) {
    if (err !== null)
      return cb(err);
    var res = {};
    if (data.next_rev !== null) {
      git.revert({folder: folder, revision: data.next_rev}, function(err, meta){
        if (err !== null)
          return cb(err);
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
