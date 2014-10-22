
var rpk = require('..');

rpk({
  folder : './test/fixtures/test_svn'
}, function(err, meta) {
  console.log(meta);
});

rpk({
  folder : './test/fixtures/test_hg'
}, function(err, meta) {
  console.log(meta);
});

rpk({
  folder : './test/fixtures/test_git'
}, function(err, meta) {
  console.log(meta);
});
