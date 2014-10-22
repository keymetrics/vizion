
var vizion = require('..');

vizion.analyze({
  folder : './test/fixtures/test_svn'
}, function(err, meta) {
  if (err !== null)
    console.error(err);
  console.log(meta);
});

vizion.analyze({
  folder : './test/fixtures/test_hg'
}, function(err, meta) {
  if (err !== null)
    console.error(err);
  console.log(meta);
});

vizion.analyze({
  folder : './test/fixtures/test_git'
}, function(err, meta) {
  if (err !== null)
    console.error(err);
  console.log(meta);
});
