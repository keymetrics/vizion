var fs = require('fs');
var exec = require('child_process').exec;

var cliCommand = require('../cliCommand');
var helper = require('../helper');

var svn = {};

svn.parse = async function(folder) {
  var getMeta = () => new Promise((resolve, reject) => {
    exec(cliCommand(folder, "svn info"), function(err, stdout, stderr) {
      if(err !== null)
        return reject(err);
      var data = {};
      data.type = 'svn';
      data.url = stdout.match(/Repository Root: ([^\n]+)/);
      if (data.url && typeof(data.url) === 'object') {
        data.url = data.url[1];
      }
      var match = stdout.match(/Relative URL: \^\/([^\n]+)/);
      if (match) {
        var relativeUrl = match[1];
        if (relativeUrl.match(/^trunk/)) {
          data.branch = 'trunk';
        } else if (relativeUrl.match(/^branch/)) {
          match = relativeUrl.match(/^branch(?:es)?\/([^/]+)(?:\/|$)/);
          if (match) {
            data.branch = match[1];
          }
        }
      }
      match = stdout.match(/Last Changed Rev: ([^\n]+)/);
      if (match) {
        data.revision = match[1];
      }
      match = stdout.match(/Last Changed Date: ([^\n]+)/);
      if (match) {
        var date = new Date(match[1]);
        data.update_time = date;
      }
      return resolve(data);
    });
  });

  var getRevComment = (data) => new Promise((resolve, reject) => {
    var rev = data.revision || "BASE";
    exec(cliCommand(folder, "svn log -r " + rev), function(err, stdout, stderr) {
      if(err !== null)
        return reject(err);
      if (rev === "BASE") {
        data.revision = stdout.match(/^(r[0-9]+)\s\|/m);
        if (data.revision) data.revision = data.revision[1];
      }
      data.comment = stdout.match(/lines?\s*\n((.|\n)*)\n-{72}\n$/);
      if (data.comment) data.comment = data.comment[1].replace(/\n/g, '');
      if (!data.update_time) {
        data.update_time = stdout.match(/-+\n(.*?)\n/);
        if (data.update_time) data.update_time = new Date(
          data.update_time[1].split(" | ")[2]
        );
      }
      resolve(data);
    });
  });

  var getDate = (data) => new Promise((resolve, reject) => {
    if (data.update_time)
      return resolve(data);
    fs.stat(folder+".svn", function(err, stats) {
      if(err !== null)
        return reject(err);
      data.update_time = stats.mtime;
      return resolve(data);
    });
  });

  const meta = await getMeta();
  const revComment = await getRevComment(meta);

  return getDate(revComment);
};

svn.isUpdated = async function(folder) {
  var res = {};

  var getRev = function(str) {
    var matches = str.match(/Changed Rev: ([^\n]+)/);
    if (matches) matches = matches[1];
    return matches;
  };

  return new Promise((resolve, reject) => {
    exec(cliCommand(folder, "svn info"), function(err, stdout, stderr) {
      if(err !== null)
        return reject(err);
      var current_rev = getRev(stdout);
      exec(cliCommand(folder, "svn info -r HEAD"), function(err, stdout, stderr) {
        if(err !== null)
          return reject(err);
        var recent_rev = getRev(stdout);
        res.is_up_to_date = (recent_rev === current_rev);
        res.new_revision = recent_rev;
        res.current_revision = current_rev;
        return resolve(res);
      });
    });
  });
};

svn.update = async function(folder) {
  var res = {};

  return new Promise((resolve, reject) => {
    exec(cliCommand(folder, "svn update"), function(err, stdout, stderr) {
      if(err !== null)
        return reject(err);
      var new_rev = stdout.match(/Updated to revision ([^\.]+)/);
      if (new_rev === null)
      {
        res.success = false;
        var old_rev = stdout.match(/At revision ([^\.]+)/);
        res.current_revision = (old_rev) ? old_rev[1] : null;
      }
      else {
        res.success = true;
        res.current_revision = new_rev[1];
      }
      return resolve(res);
    });
  });
};

module.exports = svn;
