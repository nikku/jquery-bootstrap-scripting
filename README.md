Contains some nice [jQuery](http://jquery.com) plugins to make working with the facilities provided by the 
[bootstrap](http://twitter.github.com/bootstrap) CSS framework more fun.

Dialog Two, a jQuery dialog plugin based on the bootstrap modal dialog
==========================================================================

`jquery.dialog2.js` uses the modal dialog provided by bootstrap and provides a controlable dialog functionality for web pages as a [jQuery](http://jquery.com) plugin. 

Features
--------

* Ajax content
* Ajax links and form submission in the dialog
* Loading indicator
* Localization
* No dependencies to jQuery.UI

Dependencies
------------

* [jQuery.form](http://jquery.malsup.com/form/) plugin >= 2.8 for ajax form submit 
* [jQuery.controls](https://github.com/Nikku/jquery-controls) plugin  >= 0.9 for ajax link binding support
* [Bootstrap styles](http://twitter.github.com/bootstrap) to look nice

Basic usage
-----------

* `$(selector | element | text).dialog2(options)` creates a dialog with the given `options` from an element or selector. If the selected element exists, it will be turned into the body of the newly created dialog.
* `$(".selector").dialog2("method", argument1, argument2, ...)` executes an API method (see below)

Options
-------

The `dialog2()` method accepts an options object like 

```javascript
{
  autoOpen: true | false, // Should the dialog be automatically opened?
  title: "Title of the dialog", 
  buttons: {
    name: callback | object
  }, 
  closeOnOverlayClick: true | false // Should the dialog be closed on overlay click?
}
```

API
---

* `open()`: Opens the dialog (essentially shows it if it is still hidden)
* `close()`: Closes the dialog and removes it from the document
* `options(options)`: Applies the given options to the dialog
* `addButton(label, options)`: Adds a button with the given `label` to the dialog. If `options` is a function binds the click or "enter" action of the button to it. Accepts a `{ click: callback, primary: true | false }` options object too to customize the look and feel of the button.
* `removeButton(label)`: Removes the button with the specified `label` from the list of buttons