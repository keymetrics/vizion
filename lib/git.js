var exec = require("child_process").exec;

var fs   = require("fs");

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
}

module.exports = function parseGit(folder, cb) {
	var data = {};

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
      var lines = stdout.split('\n');

      lines.forEach(function(key) {
        var parse = key.match(/([^ ]*) (.*)/);
        if (parse) {
            commit_history.push(parse[1]);
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
