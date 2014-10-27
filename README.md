
# Repository parser

Git/Subversion/Mercurial repository metadata parser

[![Build Status](https://api.travis-ci.org/keymetrics/vizion.png?branch=master)]

## Example

```javascript
var vizion = require('vizion');

/**
 * Grab metadata for svn/git/hg repositories
 */
vizion.analyze({
  folder : '/tmp/folder'
}, function(err, meta) {
  if (err) throw new Error(err);

  /**
   *
   * meta = {
   *   type        : 'git',
   *   branch      : 'development',
   *   commment    : 'This is a comment',
   *   update_time : 'DATE',
   *   url         : 'http://an.url',
   *   revision    : 'f0a1d45936cf7a3c969e4caba96546fd23255796',
   *   next_rev    : null,  // null if its latest in the branch
   *   prev_rev    : 'aaaaasdaadas7a3c969e4caba96546fd23255796'
   * }
   *
   */
});

/**
 * Check if a local repository is up to date with its remote
 */
vizion.isUpToDate({
  folder : '/tmp/folder'
}, function(err, meta) {
  if (err) throw new Error(err);

  /**
   *
   * meta = {
   *   is_up_to_date    : false,
   *   new_revision     : 'ZZZZZzzzza3c969e4caba96546fd23255796',
   *   current_revision : 'f0a1d45936cf7a3c969e4caba96546fd23255796'
   * }
   *
   */
});

/**
 * Update the local repository to latest commit found on the remote for its current branch
 * - on fail it rollbacks to the latest commit
 */
vizion.update({
  folder : '/tmp/folder'
}, function(err, meta) {
  if (err) throw new Error(err);

  /**
   *
   * meta = {
   *   success           : true,
   *   current_revision  : 'ZZZZZzzzza3c969e4caba96546fd23255796'
   * }
   *
   */
});

/**
 * Revert to a specified commit
 * - Eg: this does a git reset --hard <commit_revision>
 */
vizion.revertTo({
  revision : 'f0a1d45936cf7a3c969e4caba96546fd23255796',
  folder   : '/tmp/folder'
}, function(err, data) {
  if (err) throw new Error(err);

  /**
   *
   * data = {
   *   success          : true,
   * }
   *
   */
});

/**
 * If a previous commit exists it checkouts on it
 */
vizion.prev({
  folder : '/tmp/folder'
}, function(err, meta) {
  if (err) throw new Error(err);

  /**
   *
   * meta = {
   *   success           : true,
   *   current_revision  : 'ZZZZZzzzza3c969e4caba96546fd23255796'
   * }
   *
   */
});

/**
 * If a more recent commit exists it chekouts on it
 */
vizion.next({
  folder : '/tmp/folder'
}, function(err, meta) {
  if (err) throw new Error(err);

  /**
   *
   * meta = {
   *   success           : false,
   *   current_revision  : 'sdsdsdzzzza3c969e4caba96546fd2325576'
   * }
   *
   */
});
```
