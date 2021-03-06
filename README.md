# [TextareaBackup](https://github.com/kafene/TextareaBackup)

Keep backups of text entered into text fields

---

## What is it?

This is a userscript - a javascript file your browser runs - that
automatically backs up whatever you type into text fields (multiline ones).
When the page is refreshed or opened again, if there is text you have typed
in the past, the text field is highlighted in red and you can double click
on it to restore the previous text.

It works on both textarea elements (regardless of whether they are inside
a form), and contentEditable elements.

### Why is this useful?

If you've ever accidentally closed or reloaded a page when typing into a form,
and lost everything you typed, and you don't want it to happen again, this
will help. It's not guaranteed to work on every text field you come across,
but the large majority of them should work.

## Installation:

Place `TextareaBackup.user.js` in your browser's userscript folder.

If you don't know what that is or your browser does not support
this behavior, install a userscript plugin or browser extension,
like TamperMonkey for Chromium or Greasemonkey for Firefox.
Create a new script in it, and paste the entire contents of
`TextareaBackup.user.js` into it.

## Options:

- `expire`: the time (in ms) that items expire after. To calculate it
  you can use the formula: `(((days * 24) + hours) * 60 + minutes) * 60000`,
  for example 1 day is 86400000.

- `keepAfterSubmit`: Keep saved texts after submitting their
  associated forms (where applicable).

These options can be found `Textareabackup.user.js`,
near the top, under the line reading "`// Options:`"

## Todo:

- Backups for `<select>` and `<input>` as well.
- Improve unique element IDs (`ref()` function)
- Better restore of previous text (e.g. if a backup is accidentally
  restored after typing something new).
- More tests of backup functionality on contentEditables.
