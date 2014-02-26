/*
// ==UserScript==
// @name          TextareaBackup
// @description   Keep backups of text entered into text fields
// @author        kafene software <http://kafene.org/>
// @version       0.1
// @see           https://github.com/kafene/TextareaBackup
// @copyright     Copyright (c) 2014, kafene software <http://kafene.org/>
// @licence       GNU Affero General Public License v3.0 (AGPL-3.0)
// @namespace     https://github.com/kafene/TextareaBackup
// @downloadURL   https://raw.github.com/kafene/TextareaBackup/master/TextareaBackup.user.js
// @updateURL     https://raw.github.com/kafene/TextareaBackup/master/TextareaBackup.user.js
// @grant         none
// @include       *
// @run-at        document-end
// ==/UserScript==
*/

/* ########################################################################### /

    TextareaBackup - Keep backups of text entered into text fields
    Copyright (C) 2014  kafene software <http://kafene.org/>

    This program is free software: you can redistribute it and/or modify it
    under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License,
    or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

/ ########################################################################### */

/*

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

*/

(function backupTextareas(window, undefined) {

    // Options:
    var expire = 86400000; // 1 day
    var keepAfterSubmit = false;

    // Wait until DOM is loaded before doing anything
    var document = window.document;
    if (!/^loaded|complete|interactive/i.test(document.readyState)) {
        document.addEventListener('DOMContentLoaded', backupTextareas);
        return;
    }

    var storage = window.localStorage || window.globalStorage[document.domain];
    var selector = 'textarea, [contentEditable]';
    var editableNodes = [].slice.call(document.querySelectorAll(selector));
    var prefix = 'TextAreaBackup:' + window.location.pathname + '#';

    if (!storage || !editableNodes.length) {return}

    // [].forEach.call helper
    var each = function (obj, fn) {[].forEach.call(obj, fn)};

    // get a unique identifying for a node.
    var ref = function (node) {
        if (node.id || node.name) {
            return prefix + (node.id || '') + (node.name || '');
        } else {
            var i = editableNodes.indexOf(node);
            return -1 == i ? null : prefix + '[' + i + ']';
        }
    };

    var isTextarea = function (node) {
        return (node && node instanceof win.HTMLTextAreaElement);
    };

    var isContentEditable = function (node) {
        return (node && (node.isContentEditable || node.contentEditable === 'true'));
    };

    var isEditableNode = function (node) {
        return isTextarea(node) || isContentEditable(node);
    };

    // clear expired items and empty items. (garbage collection)
    var gc = function () {
        if (expire && expire > 0) {
            var time = (new Date()).getTime();
            var item = null;
            var diff = 0;
            var key = '';

            for (var i = 0; i < storage.length; i++) {
                key = storage.key(i);

                if (0 !== key.indexOf('TextAreaBackup:')) {continue}

                try {
                    item = JSON.parse(storage.getItem(key));
                } catch (err) {
                    debug("JSON.parse failed (or no item for key).");
                    continue;
                }

                if (item && item.time) {
                    var diff = (+new Date()) - item.time;
                    var expired = diff >= expire;
                    var empty = String(item.value).trim() == '';
                    if (empty || expired) {storage.removeItem(key)}
                }
            }
        }
    };

    var getNodeValue = function (node) {
        if (isTextarea(node) && node.value) {
            return String(node.value).trim() || '';
        } else if (isContentEditable(node) && node.innerHTML) {
            return String(node.innerHTML).trim() || '';
        } else {
            return '';
        }
    };

    var setNodeValue = function (node, text) {
        if (isTextarea(node)) {
            node.value = text + '';
        } else if (isContentEditable(node)) {
            node.innerHTML = text + '';
        }
    };

    var listener = function (event) {
        var node = event.target || event.srcElement;
        var value = getNodeValue(node);
        var time = (new Date()).getTime();
        var key = ref(node);
        if (key) {
            try {
                storage.setItem(key, JSON.stringify({
                    key: key,
                    value: value,
                    time: time
                }));
            } catch (err) {
                debug("JSON.stringify failed.");
            }
        }
    };

    var save = function (node) {
        node.addEventListener('keyup', listener);
        node.addEventListener('input', listener);
        node.addEventListener('change', listener);
        node.addEventListener('paste', listener);
        node.addEventListener('blur', listener);
        // node.addEventListener('DOMAttrModified', listener);
        // node.addEventListener('textInput', listener);
        // node.addEventListener('click', listener);
        // node.addEventListener('focus', listener);
    };

    var initBackup = function (node) {
        // read value of existing saved data and pre-fill it.
        var originalText = getNodeValue(node);
        var nodeRef = ref(node);
        var item = nodeRef ? (storage.getItem(nodeRef) || null) : null;

        if (item) {
            try {
                item = JSON.parse(item);
                item.value = String(item.value).trim();
            } catch (err) {
                debug("JSON.parse failed.");
                item = null;
            }

            // apply a red border indicator, restore on double click.
            if (item && item.value) {
                //var originalBorder = win.getComputedStyle(node).border;
                node.style.border = '2px solid red';
                node.addEventListener('dblclick', function () {
                    if (node.getAttribute('data-text-restored') === 'yes') {
                        node.setAttribute('data-text-restored', 'no');
                        setNodeValue(node, originalText);
                        node.style.border = '2px solid red';
                    } else {
                        node.setAttribute('data-text-restored', 'yes');
                        setNodeValue(node, item.value);
                        //node.style.border = originalBorder + "";
                        node.style.border = "";
                    }
                });
            }
        }

        save(node);

        // Clear saved data on form submit
        if (keepAfterSubmit && node.form) {
            node.form.addEventListener('submit', function (event) {
                each(editableNodes, function (node) {
                    if (node.form == event.target) {
                        storage.removeItem(nodeRef);
                    }
                });
            }, false);
        }
    };

    // Back up inserted nodes and any editable child nodes.
    var backupInsertedNode = function (node) {
        if (isTextarea(node) || isContentEditable(node)) {
            // Add the node to editableNodes so it can be tracked in ref()
            editableNodes.push(node);
            initBackup(node);
        }

        if (node.querySelectorAll) {
            each(node.querySelectorAll(selector), backupInsertedNode);
        }
    };

    var initMutationObserver = function () {
        var MutationObserver = win.MutationObserver ||
            win.WebKitMutationObserver ||
            win.MozMutationObserver;

        if (typeof(MutationObserver) !== 'undefined') {
            (new MutationObserver(function (mutations) {
                each(mutations, function (mutation) {
                    each(mutation.addedNodes, function (node) {
                        backupInsertedNode(node);
                    });
                });
            }).observe(win.document.documentElement, {
                subtree: true,
                childList: true
            }));
        }
    };

    var initDOMNodeInsterted = function () {
        document.addEventListener('DOMNodeInserted', function (event) {
            if (event && event.target) {backupInsertedNode(event.target)}
        });
    };

    gc();
    each(editableNodes, initBackup);
    initMutationObserver();
    initDOMNodeInsterted();
})(window.wrappedJSObject || window);
