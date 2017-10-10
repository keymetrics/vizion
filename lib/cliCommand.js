var PLATFORM = {
    WINDOWS: 'WINDOWS',
    UNIX: 'UNIX'
};

function getPlatform(platformKey) {
    switch (platformKey) {
        case 'win32':
        case 'win64':
            return PLATFORM.WINDOWS;
        default:
            return PLATFORM.UNIX;
    }
}

function getCdCommand() {
    switch (this.platform) {
        case PLATFORM.WINDOWS:
            return function cdToPath(folder) {
                return 'cd ' + folder;
            };
        case PLATFORM.UNIX:
            return function cdToPath(folder) {
                return 'cd ' + folder;
            };
    }
}

function getCleanseCommand(setEnvVar) {
    switch (this.platform) {
        case PLATFORM.WINDOWS:
            return function (cmd) {
                return [setEnvVar(), cmd].join(' ');
            };
        case PLATFORM.UNIX:
            return function (cmd) {
                return [setEnvVar("LC_ALL", "en_US.UTF-8"), cmd].join(' ');
            };
    }
}

function getSetEnv() {
    switch (this.platform) {
        case PLATFORM.WINDOWS:
            return function (k, v) {
                if (!k)
                    return "";
                return "SET ".concat([k,v].join('='));
            };
        case PLATFORM.UNIX:
            return function (k, v) {
                if (!k)
                    return "";
                return [k,v].join('=');
            };
    }
}

function getConcatenator() {
    switch(this.platform) {
        case PLATFORM.WINDOWS:
            return function (cmds) {
                var cmdText = '';
                for (var i = 0; i < cmds.length; i++) {
                    cmdText += cmds[i];
                    if (i < cmds.length - 1)
                        cmdText += " && ";
                }
                return cmdText;
            };
        case PLATFORM.UNIX:
            return function (cmds) {
                var cmdText = '';
                for (var i = 0; i < cmds.length; i++) {
                    cmdText += cmds[i];
                    if (i < cmds.length - 1)
                        cmdText += ";";
                }
                return cmdText;
            };
    }
}

var cliCommand = (function getExecutor(platformKey) {
    this.platform = getPlatform(platformKey);

    var cdTo = getCdCommand.call(this);
    var concat = getConcatenator.call(this);
    var setEnvVar = getSetEnv.call(this);
    var cleanse = getCleanseCommand.call(this, setEnvVar);

    return function (folder, cmd) {
        var cmds = [];
        cmds.push(cdTo(folder));
        cmds.push(cleanse(cmd));

        return concat(cmds);
    }
})(process.platform);

module.exports = cliCommand;