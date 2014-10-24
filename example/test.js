
var vizion = require('..');

// .analyze()

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

// .isUpToDate()

vizion.isUpToDate({
  folder : './test/fixtures/test_svn'
}, function(err, meta) {
  if (err !== null)
    console.error(err);
  console.log(meta);
});

vizion.isUpToDate({
  folder : './test/fixtures/test_hg'
}, function(err, meta) {
  if (err !== null)
    console.error(err);
  console.log(meta);
});

vizion.isUpToDate({
  folder : './test/fixtures/test_git'
}, function(err, meta) {
  if (err !== null)
    console.error(err);
  console.log(meta);
});
