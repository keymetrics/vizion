
# Repository parser

Git/Subversion/Mercurial repository metadata parser

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
 * Know if a path is up to date
 */
 vizion.isUpToDate({
 folder : '/tmp/folder'
 }, function(err, meta) {
 if (err) throw new Error(err);

 /**
 *
 * meta = {
 *   is_up_to_date : false,
 *   new_revision  : 'ZZZZZzzzza3c969e4caba96546fd23255796'
 * }
 *
 */
 });

 /**
 * Update the repository to latest
 * - on fail it should rollback to the latest commit (maybe it's already an automatic thing)
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
 * - Eg: this do a git reset --hard <commit_revision>
 */
 vizion.revertTo({
 revision : 'f0a1d45936cf7a3c969e4caba96546fd23255796',
 branch   : 'master', // Do we need the branch name when we pass a commit id ?
 folder   : '/tmp/folder'
 }, function(err, data) {
 if (err) throw new Error(err);

 /**
 *
 * data = {
 *   success          : true,
 *   current_revision : 'f0a1d45936cf7a3c969e4caba96546fd23255796'
 * }
 *
 */                                                                                                                                                        });
```
