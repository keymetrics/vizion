var fs = require("fs");
var async = require('async');
var exec = require("child_process").exec;

var svn = {};

svn.parse = function(folder, cb) {
  // var myTrim = function(str) {
  //   if (typeof(str) === 'string')
  //     return str.replace(/\n/g, '');
  //   return str;
  // }

  var getMeta = function(cb) {
    exec("cd '"+folder+"';svn info", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var data = {};
      data.type = 'svn';
      data.url = stdout.match(/Repository Root:([^\n]+)/);
      if (data.url) data.url = data.url[1];
      data.branch = data.url.match(/[^/]+$/);
      if (data.branch) data.branch = data.branch[0];
      return cb(null, data);
    });
  }

  var getRevComment = function(data, cb) {
    exec("cd '"+folder+"';svn log -r COMMITTED", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var message = stdout.match(/^(r[0-9]+)\s\|/m);
      var summary = stdout.match(/lines?\s*\n((.|\n)*)\n-{72}\n$/);
      data.revision = message[1];
      data.comment = summary[1].replace(/\n/g, '');
      cb(null, data);
    });
  }

  var getDate = function(data, cb) {
    fs.stat(folder+".svn", function(err, stats) {
      if(err !== null)
        return cb(err);
      data.update_time = stats.mtime;
      return cb(null, data);
    });
  }

  async.waterfall([getMeta, getRevComment, getDate],
  function(err, data) {
    if (err !== null)
      return cb(err);
    return cb(null, data);
  });
}

module.exports = svn;
