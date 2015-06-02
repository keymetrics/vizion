var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;

var svn = {};

svn.parse = function(folder, cb) {
  var myTrim = function(str) {
    if (typeof(str) === 'string')
      return str.replace(/\n/g, '');
    return str;
  };

  var getUrl = function(cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 svn info", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);

      var data = {};

      data.type = 'svn';
      data.url = stdout.match(/Repository Root: ([^\n]+)/);
      if (data.url && typeof(data.url) === 'object')
        data.url = data.url[1];
      return cb(null, data);
    });
  };

  var getMeta = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 svn log -l 1", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);

      var lines = stdout.split(/[\n|]/);

      //Deleting useless lines
      lines.splice(0, 1);
      lines.splice(1, 1);
      lines.splice(2, 2);
      lines.splice(3, 2);

      data.revision = lines[0];
      data.update_time = lines[1].match(/(\d[^\n]+?(?=\s\())/);
      if (data.update_time && typeof(data.update_time) === 'object')
        data.update_time = data.update_time[1];
      data.comment = lines[2];

      return cb(null, data);
    });
  };

  var getStaged = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 svn status", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);

      data.unstaged = (stdout === '') ? false : true;
      return cb(null, data);
    });
  };

  var getBranch = function(data, cb) {
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 svn info | grep '^URL:' | egrep -o '(tags|branches)/[^/]+|trunk' | egrep -o '[^/]+$'", function (err, stdout, stderr) {
      if (err !== null)
        return cb(err);

      data.type = 'svn';
      data.branch = myTrim(stdout);
      return cb(null, data);
    });
  };

  var getDate = function(data, cb) {
    fs.stat(folder+".svn", function(err, stats) {
      if(err !== null)
        return cb(err);
      data.update_time = stats.mtime;
      return cb(null, data);
    });
  };

  async.waterfall([getUrl, getMeta, getStaged, getBranch, getDate],
  function(err, data) {
    if (err !== null)
      return cb(err);
    return cb(null, data);
  });
};

svn.isUpdated = function(folder, cb) {
  var res = {};

  var getRev = function(str) {
    var matches = str.match(/Changed Rev: ([^\n]+)/);
    if (matches) matches = matches[1];
    return matches;
  };

  exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 svn info", function(err, stdout, stderr) {
    if(err !== null)
      return cb(err);
    var current_rev = getRev(stdout);
    exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 svn info -r HEAD", function(err, stdout, stderr) {
      if(err !== null)
        return cb(err);
      var recent_rev = getRev(stdout);
      res.is_up_to_date = (recent_rev === current_rev);
      res.new_revision = recent_rev;
      res.current_revision = current_rev;
      return cb(null, res);
    });
  });
};

svn.update = function(folder, cb) {
  var res = {};

  exec("cd '"+folder+"';LC_ALL=en_US.UTF-8 svn update", function(err, stdout, stderr) {
    if(err !== null)
      return cb(err);
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
    return cb(null, res);
  });
};

svn.revert = function(args, cb) {
  exec("cd '"+args.folder+"';LC_ALL=en_US.UTF-8 svn merge --accept tf -c-"+args.revision+" .",
  function(err, stdout, stderr) {
    if (err !== null || stderr.substring(0, 6) === 'fatal:')
      return cb(null, {success: false});
    return cb(null, {success: true});
  });
};

svn.prev = function(folder, cb) {
  svn.parse(folder, function(err, data) {
    if (err !== null)
      return cb(err);
    var res = {};
    if (data.prev_rev !== null) {
      svn.revert({folder: folder, revision: data.prev_rev}, function(err, meta){
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


///svn deosn't allow locking of revision numbers, need to find a better way of doing this
svn.next = function(folder, cb) {
  svn.parse(folder, function(err, data) {
    if (err !== null)
      return cb(err);
    var res = {};
    if (data.next_rev !== null) {
     svn.revert({folder: folder, revision: data.next_rev}, function(err, meta){
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

module.exports = svn;