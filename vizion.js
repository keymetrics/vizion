var fs   = require("fs");
var exec = require("child_process").exec;

var halt = false;

function error(repoType, task, errorMsg, cb) {
	if (halt) return false;

	console.error("[Repo-Parser] An error occured while " + task + " in a " + repoType + " repository: " + errorMsg);
	halt = true;
  return cb("[Repo-Parser] An error occured while " + task + " in a " + repoType + " repository: " + errorMsg);
}

function checkReturn(dataArray, cb) {
	if (halt) {
		return false;
	}
	if (Object.keys(dataArray).length > 7) {
    Object.keys(dataArray).forEach(function(key) {
      if (typeof(dataArray[key]) === 'string') {
        dataArray[key] = dataArray[key].replace(/\n/g, '');
      }
    });
		cb(null, dataArray);
	}
};

function parseHg(opts, cb) {
	var data = {};
  var folder = opts.folder; // temporary

  data.type = 'mercurial';
  data.commit_history = []; // temporary
  data.is_updated = true; // temporary

	exec("cd '"+folder+"'; hg paths default", function(err, stdout, stderr) {
		if(err !== null) {
			error("mercurial", "fetching path", stderr, cb);
		}
		else {
			data.url = stdout;
			checkReturn(data, cb);
		}
	});
	exec("cd '"+folder+"'; hg log --limit 1", function(err, stdout, stderr) {
		if(err !== null) {
			error("mercurial", "fetching log", stderr, cb);
		}
		else {
			var changeset = stdout.match(/^changeset:\s+([^\n]+)$/m);
			//date = stdout.match(/^date:\s+:([^\n]+)$/m);
			var summary = stdout.match(/^summary:\s+([^\n]+)$/m);
			data.revision = changeset[1];
			data.comment = summary[1];
			//data.update_time = date;
			checkReturn(data, cb);
		}
	});
	exec("cd '"+folder+"'; hg branch", function(err, stdout, stderr) {
		if(err !== null) {
			error("mercurial", "fetching branch", stderr, cb);
		}
		else {
			data.branch = stdout;
			checkReturn(data, cb);
		}
	});
	fs.stat(folder+".hg", function(err, stats) {
		if(err !== null) {
			error("mercurial", "fetching stats", "no error available", cb);
		}
		else {
			data.update_time = stats.mtime;
			checkReturn(data, cb);
		}
	});
}

function parseGit(opts, cb) {
	var data = {};
  var folder = opts.folder; // temporary

  data.type = 'git';

	exec("cd '"+folder+"'; git config --get remote.origin.url", function(err, stdout, stderr) {
		if(err !== null) {
			error("git", "fetching path", stderr, cb);
		}
		else {
			data.url = stdout;
			checkReturn(data, cb);
		}
	});
	exec("cd '"+folder+"'; git show --quiet --format=%H%n%aD%n%s%n%B HEAD", function(err, stdout, stderr) {
		if(err !== null) {
			error("git", "fetching log", stderr, cb);
		}
		else {
			var lines = stdout.split("\n");
			data.revision = lines.shift();
			data.update_time = lines.shift();
			data.comment = lines.shift();
			// data.message = lines.join("\n"); // the full commit message - includes the subject.
			checkReturn(data, cb);
		}
	});
	exec("cd '"+folder+"'; git rev-parse --abbrev-ref HEAD", function(err, stdout, stderr) {
		if(err !== null) {
			error("git", "fetching branch", stderr, cb);
		}
		else {
			data.branch = stdout.replace(/\n/g, '');
      setTimeout(function() {
        exec("cd '"+folder+"'; git remote", function(err, stdout, stderr) {
          if(err !== null) {
			      error("git", "fetching remote name", stderr, cb);
		      }
          else {
            var remote = stdout.replace(/\n/g, '');
            exec("cd '"+folder+"'; git remote update >> /dev/null 2>&1; git log " + remote
                 + "/" + data.branch + " --pretty=oneline -n 1", function(err, stdout, stderr) {
                   if(err !== null) {
			               error("git", "fetching remote for updates", stderr, cb);
		               }
                   else {
                     if (stdout.substring(0, 40) === data.revision.substring(0, 40)) {
                       data.is_updated = true;
                     } else {
                       data.is_updated = false;
                     }
                   }
                   checkReturn(data, cb);
            });
          }
        });
      }, 50);
		}
	});
  exec("cd '"+folder+"'; git log --pretty=oneline", function(err, stdout, stderr) {
		if(err !== null) {
			error("git", "fetching commits history", stderr, cb);
		}
		else {
      var commit_history = [];
      var lines = stdout.split('\n', opts.count);

      lines.forEach(function(key) {
        var parse = key.match(/([^ ]*) (.*)/);
        if (parse) {
          if (opts.compact) {
            commit_history.push(parse[1].substring(0, 7));
          } else {
            commit_history.push({'commit': parse[1], 'comment': parse[2]});
          }
        }
      });
			data.commit_history = commit_history;
			checkReturn(data, cb);
		}
	});
	fs.stat(folder+".git", function(err, stats) {
		if(err !== null) {
			error("git", "fetching stats", err, cb);
		}
		else {
			data.update_time = stats.mtime;
			checkReturn(data, cb);
		}
	});
}

function parseSvn(opts, cb) {
	var data = {};
  var folder = opts.folder;// temporary

  data.type = 'svn';
  data.commit_history = []; // temporary
  data.is_updated = true; // temporary

	exec("cd '"+folder+"'; svn info | grep 'Repository Root' | awk '{print $NF}'", function(err, stdout, stderr) {
		if(err !== null) {
			error("subversion", "fetching path", stderr, cb);
		}
		else {
			data.url = stdout;
			checkReturn(data, cb);
		}
	});

	exec("cd '"+folder+"'; svn log -r COMMITTED", function(err, stdout, stderr) {
		if(err !== null) {
			error("subversion", "fetching log", stderr, cb);
		}
		else {
			var message = stdout.match(/^(r[0-9]+)\s\|/m);
			//date = stdout.match(/^date:\s+:([^\n]+)$/m);
			var summary = stdout.match(/lines?\s*\n((.|\n)*)\n-{72}\n$/);
			data.revision = message[1];
			data.comment = summary[1];
			//data.update_time = date;
			checkReturn(data, cb);
		}
	});
	exec("cd '"+folder+"'; svn info | sed -n \"/URL:/s/.*\\///p\"", function(err, stdout, stderr) {
		if(err !== null) {
			error("subversion", "fetching branch", stderr, cb);
		}
		else {
			data.branch = stdout;
			checkReturn(data, cb);
		}
	});
	fs.stat(folder+".svn", function(err, stats) {
		if(err !== null) {
			error("subversion", "fetching stats", "no error available", cb);
		}
		else {
			data.update_time = stats.mtime;
			checkReturn(data, cb);
		}
	});
}

function repo_parser(args, cb) {
	var folder = (args.folder != undefined) ? args.folder : '.';
  var compact = (args.compact != undefined) ? args.compact : true;
  var count = (args.count != undefined) ? args.count : 10;

  if (folder[folder.length - 1] !== '/') {
    folder = folder + '/';
  }

  var opts = {folder: folder, compact: compact, count: count};

  fs.exists(folder+'.git', function(exists) {
		if (exists) {
			return parseGit(opts, cb);
		}
    fs.exists(folder+'.hg', function(exists) {
		  if (exists) {
			  return parseHg(opts, cb);
		  }
      fs.exists(folder+'.svn', function(exists) {
		    if (exists) {
			    return parseSvn(opts, cb);
		    }
        else {
          return cb({
            msg : 'No versioning system found',
            path : folder
          });
        }
	    });
      return false;
	  });
    return false;
	});
}

module.exports = repo_parser;
