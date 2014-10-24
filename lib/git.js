var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;

var git = {};

var myTrim = function(str) {
  if (typeof(str) === 'string')
    return str.replace(/\n/g, '');
  return str;
}

git.parse = function(folder, cb) {

  var getUrl = function(cb) {
    exec("cd '"+folder+"'; git config --get remote.origin.url", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var data = {};
      data.type = 'git';
      data.url = myTrim(stdout);
      return cb(null, data);
    });
  }

  var getMeta = function(data, cb) {
    exec("cd '"+folder+"'; git show --quiet --format=%H%n%aD%n%s%n%B HEAD", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var lines = stdout.split("\n");
      data.revision = myTrim(lines.shift());
      data.update_time = myTrim(lines.shift());
      data.comment = myTrim(lines.shift());
      return cb(null, data);
    });
  }

  var getBranch = function(data, cb) {
    exec("cd '"+folder+"'; git rev-parse --abbrev-ref HEAD", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      data.branch = myTrim(stdout);
      return cb(null, data);
    });
  }

  var getRemote = function(data, cb) {
    exec("cd '"+folder+"'; git remote", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      data.remote = myTrim(stdout);
      return cb(null, data);
    });
  }

  // var isUpdated = function(data, cb) {
  //   exec("cd '"+folder+"'; git remote update >> /dev/null 2>&1; git log " + data.remote
  //        + "/" + data.branch + " --pretty=oneline -n 1", function(err, stdout, stderr) {
  //          if(err !== null)
  //            return cb(err);
  //          if (stdout.substring(0, 40) === data.revision.substring(0, 40)) {
  //            data.is_updated = true;
  //          } else {
  //            data.is_updated = false;
  //          }
  //          return cb(null, data);
  //        });
  // }

  var getHistory = function(data, cb) {
    exec("cd '"+folder+"'; git log --pretty=oneline", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var commit_history = [];
      var lines = stdout.split('\n');

      lines.forEach(function(key) {
        var parse = key.match(/([^ ]*) (.*)/);
        if (parse)
          commit_history.push(parse[1]);
      });
      data.commit_history = commit_history;
      return cb(null, data);
    });
  }

  var getDate = function(data, cb) {
    fs.stat(folder+".git", function(err, stats) {
      if(err !== null)
        return cb(err);
      data.update_time = myTrim(stats.mtime);
      return cb(null, data);
    });
  }

  async.waterfall([getUrl, getMeta, getBranch, getHistory, getDate],
  function(err, data) {
    if (err !== null)
      return cb(err);
    return cb(null, data);
  });
}

module.exports = git;
