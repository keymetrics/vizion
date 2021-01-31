var fs = require('fs');
var helper = require('./helper');

var allTypes = ['git', 'hg', 'svn'];

module.exports = async function(folder) {
  if (folder[folder.length - 1] !== '/')
    folder += '/';

  const type = await helper.findAsync(allTypes.map(
    async function (type) {
      const exists = await new Promise((resolve) => {
        fs.exists(folder + '.' + type, resolve);
      });
      return exists ? type : undefined;
    }
  ));

  return { type, folder };
};
