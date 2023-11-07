* rewrite custom parsing code as markdown-it plugin(s)
  The current regexp based code is inflexible, and doesn't handle escapes properly. Switching to
  markdown-it plugins will give us a vastly more robust framework
* add unit tests
  duh, but requires a lot more refactoring before this is viable