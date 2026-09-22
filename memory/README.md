# Project memory

Notes Claude keeps about THIS project. Committed on purpose so they travel with
`git clone` - including to the Mac, where Claude's own local memory folder does
not exist.

Claude's working memory lives at `~/.claude/projects/<folder-named-after-the-full-path>/memory/`.
That folder name is built from the absolute file path, so it differs on every
machine and breaks whenever a project moves. This folder is the portable copy.

`_merged-from-old-path/` holds older versions of notes recovered from a previous
location of this project, kept in case they say something the current notes do not.
