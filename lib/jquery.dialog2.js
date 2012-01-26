/*
 * Dialog2: Yet another dialog plugin for jQuery.
 * 
 * This time based on bootstrap styles with some nice ajax control features, 
 * zero dependencies to jQuery.UI and basic options to control it.
 * 
 * Licensed under the MIT license 
 * http://www.opensource.org/licenses/mit-license.php 
 * 
 * @version: 1.2.0 (15/09/2011)
 * 
 * @requires jQuery >= 1.4 
 * 
 * @requires jQuery.form plugin (http://jquery.malsup.com/form/) >= 2.8 for ajax form submit 
 * @requires jQuery.controls plugin (https://github.com/Nikku/jquery-controls) >= 0.9 for ajax link binding support
 * 
 * @requires bootstrap styles (twitter.github.com/bootstrap) to look nice
 * 
 * @author nico.rehwaldt
 */
(function($) {
    
    /**
     * Dialog html markup
     */
    var __DIALOG_HTML = "<div class='modal'>" + 
        "<div class='modal-header'>" +
        "<h3></h3><span class='loader'></span>" + 
        "<a href='#' class='close'></a>" + 
        "</div>" + 
        "<div class='modal-body'>" + 
        "</div>" + 
        "<div class='modal-footer'>" + 
        "</div>" + 
        "</div>";
    
    /**
     * Constructor of Dialog2 internal representation 
     */
    var Dialog2 = function(element, options) {
        this.__init(element, options);
        
        var dialog = this;
        var handle = this.__handle;
        
        this.__ajaxCompleteTrigger = $.proxy(function() {
            this.trigger("dialog2.ajax-complete");
        }, handle);
        
        this.__ajaxStartTrigger = $.proxy(function() {
            this.trigger("dialog2.ajax-start");
        }, handle);
         
        this.__removeDialog = $.proxy(this.__remove, this);
        
        handle.bind("dialog2.ajax-start", function() {
            dialog.options({ buttons: options.autoAddCancelButton ? localizedCancelButton() : {}});
            handle.parent().addClass("loading");
        });
        
        handle.bind("dialog2.content-update", function() {
            dialog.__ajaxify();
            dialog.__updateMarkup();
            dialog.__focus();
        });
        
        handle.bind("dialog2.ajax-complete", function() {
            handle.parent().removeClass("loading");
            handle.trigger("dialog2.content-update");
        });
        
        // Apply options to make title and stuff shine
        this.options(options);

        // We will ajaxify its contents when its new
        // aka apply ajax styles in case this is a inpage dialog
        handle.trigger("dialog2.content-update");
    };
    
    /**
     * Dialog2 api; methods starting with underscore (__) are regarded internal
     * and should not be used in production environments
     */
    Dialog2.prototype = {
    
        /**
         * Core function for creating new dialogs.
         * Transforms a jQuery selection into dialog content, following these rules:
         * 
         * // selector is a dialog? Does essentially nothing
         * $(".selector").dialog2();
         * 
         * // .selector known?
         * // creates a dialog wrapped around .selector
         * $(".selector").dialog2();
         * 
         * // creates a dialog wrapped around .selector with id foo
         * $(".selector").dialog2({id: "foo"});
         * 
         * // .unknown-selector not known? Creates a new dialog with id foo and no content
         * $(".unknown-selector").dialog2({id: "foo"});
         */    
        __init: function(element, options) {
            var selection = $(element);
            var handle;

            if (!selection.is(".modal-body")) {
                var overlay = $('<div class="modal-backdrop"></div>').hide();
                var parentHtml = $(__DIALOG_HTML);

                if (options.modalClass) {
                    parentHtml.addClass(options.modalClass);
                    delete options.modalClass;
                }
                
                $(".modal-header a.close", parentHtml)
                    .text(unescape("%D7"))
                    .click(function(event) {
                        event.preventDefault();

                        $(this)
                            .parents(".modal")
                            .find(".modal-body")
                                .dialog2("close");
                    });

                $("body").append(overlay).append(parentHtml);
                
                handle = $(".modal-body", parentHtml);

                // Create dialog body from current jquery selection
                // If specified body is a div element and only one element is 
                // specified, make it the new modal dialog body
                // Allows us to do something like this 
                // $('<div id="foo"></div>').dialog2(); $("#foo").dialog2("open");
                if (selection.is("div") && selection.length == 1) {
                    handle.replaceWith(selection);
                    selection.addClass("modal-body").show();
                    handle = selection;
                }
                // If not, append current selection to dialog body
                else {
                    handle.append(selection);
                }

                if (options.id) {
                    handle.attr("id", options.id);
                }
            } else {
                handle = selection;
            }
            
            this.__handle = handle;
            this.__overlay = handle.parent().prev(".modal-backdrop");
        }, 
        
        /**
         * Parse dialog content for markup changes (new buttons or title)
         */
        __updateMarkup: function() {
            var dialog = this;
            var e = dialog.__handle;
            
            e.trigger("dialog2.before-update-markup");
            
            // New options for dialog
            var options = {};

            // Add buttons to dialog for all buttons found within 
            // a .actions area inside the dialog
            var actions = $(".actions", e).hide();
            var buttons = actions.find("input[type=submit], input[type=button], input[type=reset], button, .btn");

            if (buttons.length) {
                options.buttons = {};

                buttons.each(function() {
                    var button = $(this);
                    var name = button.is("input") ? button.val() || button.attr("type") : button.text();

                    options.buttons[name] = {
                        primary: button.is("input[type=submit] .primary"),
                        type: button.attr("class"), 
                        click: function(event) {
                            // simulate click on the original button
                            // to not destroy any event handlers
                            button.click();

                            if (button.is(".close-dialog")) {
                                dialog.close();
                            }
                        }
                    };
                });
            }

            // set title if content contains a h1 element
            var titleElement = e.find("h1").hide();
            if (titleElement.length > 0) {
                options.title = titleElement.text();
            }

            // apply options on dialog
            dialog.options(options);
            
            e.trigger("dialog2.after-update-markup");
        },
        
        /**
         * Apply ajax specific dialog behavior to the dialogs contents
         */
        __ajaxify: function() {
            var dialog = this;
            var e = this.__handle;

            e.trigger("dialog2.before-ajaxify");
            
            e.find("a.ajax").click(function(event) {
                var url = $(this).attr("href");
                dialog.load(url);
                event.preventDefault();
            }).removeClass("ajax");

            // Make submitable for an ajax form 
            // if the jquery.form plugin is provided
            if ($.fn.ajaxForm) {
                $("form.ajax", e).ajaxForm({
                    target: e,
                    success: dialog.__ajaxCompleteTrigger,
                    beforeSubmit: dialog.__ajaxStartTrigger, 
                    error: function() {
                        throw dialogError("Form submit failed: " + $.makeArray(arguments));
                    }
                }).removeClass("ajax");
            }
            
            e.trigger("dialog2.after-ajaxify");
        },
        
        /**
         * Removes the dialog instance and its 
         * overlay from the DOM
         */
        __remove: function() {
            this.__overlay.remove();
            this.__handle.remove().removeData("dialog2");
        }, 
        
        /**
         * Focuses the dialog which will essentially focus the first
         * focusable element in it (e.g. a link or a button on the button bar).
         */
        __focus: function() {
            var dialog = this.__handle;
            
            // Focus first focusable element in dialog
            var focusable = dialog.find("a, input:not(*[type=hidden]), .btn, select, textarea, button")
                                  .filter(function() {
                                      return $(this).parents(".actions").length == 0;
                                  }).eq(0);
                                  
            // Which might be a button, too
            if (!focusable.length) {
                focusable = dialog.parent().find(".modal-footer").find("input[type=submit], input[type=button], .btn, button");
                if (focusable.length) {
                    focusable = focusable.eq(0);
                }
            }

            focusable.focus();
        }, 
        
        /**
         * Close the dialog, removing its contents from the DOM if that is
         * configured.
         */
        close: function() {
            var dialog = this.__handle;
            var overlay = this.__overlay;
            
            overlay.hide();
            
            dialog
                .parent().hide().end()
                .trigger("dialog2.closed")
                .removeClass("opened");
        },
        
        /**
         * Open a dialog, if it is not opened already
         */
        open: function() {
            var dialog = this.__handle;
            
            if (!dialog.is(".opened")) {
                this.__overlay.show();
                
                dialog
                    .trigger("dialog2.before-open")
                    .addClass("opened")
                    .parent()
                        .show()
                        .end()
                    .trigger("dialog2.opened");
                    
                this.__focus();
            }
        }, 
        
        /**
         * Add button with the given name and options to the dialog
         * 
         * @param name of the button
         * @param options either function or options object configuring 
         *        the behaviour and markup of the button
         */
        addButton: function(name, options) {
            var handle = this.__handle;
            
            var callback = $.isFunction(options) ? options : options.click;
            var footer = handle.siblings(".modal-footer");

            var button = $("<a href='#' class='btn'></a>")
                                .text(name)
                                .click(function(event) {
                                    callback.apply(handle, [event]);
                                    event.preventDefault();
                                });

            // legacy
            if (options.primary) {
                button.addClass("primary");
            }

            if (options.type) {
                button.addClass(options.type);
            }

            footer.append(button);
        }, 
        
        /**
         * Remove button with the given name
         * 
         * @param name of the button to be removed
         */
        removeButton: function(name) {
            var footer = this.__handle.siblings(".modal-footer");
                
            footer
                .find("a.btn")
                    .filter(function(i, e) {return $(e).text() == name;})
                        .remove();
        }, 
        
        /**
         * Load the given url as content of this dialog
         * 
         * @param url to be loaded via GET
         */
        load: function(url) {
            var handle = this.__handle;
            
            if (handle.is(":empty")) {
                var loadText = this.options().initialLoadText;
                handle.html($("<span></span>").text(loadText));
            }
            
            handle.trigger("dialog2.ajax-start")
                  .load(url, this.__ajaxCompleteTrigger);
        },
        
        /**
         * Apply the given options to the dialog
         * 
         * @param options to be applied
         */
        options: function(options) {
            var storedOptions = this.__handle.data("options");
            
            // Return stored options if getter was called
            if (!options) {
                return storedOptions;
            }
            
            var buttons = options.buttons;
            delete options.buttons;
            
            // Store options if none have been stored so far
            if (!storedOptions) {
                this.__handle.data("options", options);
            }
            
            var dialog = this;
            
            var handle = dialog.__handle;
            var overlay = dialog.__overlay;
            
            var parentHtml = handle.parent();
            
            if (options.title) {
                $(".modal-header h3", parentHtml).text(options.title);
            }
            
            if (buttons) {
                if (buttons.__mode != "append") {
                    $(".modal-footer", parentHtml).empty();
                }
                
                $.each(buttons, function(name, value) {
                    dialog.addButton(name, value);
                });
            }
            
            if (__boolean(options.closeOnOverlayClick)) {
                overlay.unbind("click");
                
                if (options.closeOnOverlayClick) {
                    overlay.click(function(event) {
                        if ($(event.target).is(".modal-backdrop")) {
                            dialog.close();
                        }
                    });
                }
            }
            
            if (__boolean(options.showCloseHandle)) {
                var closeHandleMode = options.showCloseHandle ? "show" : "hide";
                $(".modal-header .close", parentHtml)[closeHandleMode]();
            }
            
            if (__boolean(options.removeOnClose)) {
                handle.unbind("dialog2.closed", this.__removeDialog);
                
                if (options.removeOnClose) {
                    handle.bind("dialog2.closed", this.__removeDialog);
                }
            }
            
            if (options.autoOpen === true) {
                this.open();
            }
            
            if (options.content) {
                this.load(options.content);
            }
            
            delete options.buttons;
            
            options = $.extend(true, {}, storedOptions, options);
            this.__handle.data("options", options);
            
            return this;
        }, 
        
        /**
         * Returns the html handle of this dialog
         */
        handle: function() {
            return this.__handle;
        }
    };
    
    /**
     * Plugging the extension into the jQuery API
     */
    $.extend($.fn, {
        
        /**
         * options = {
         *   title: "Some title", 
         *   id: "my-id", 
         *   buttons: {
         *     "Name": Object || function   
         *   }
         * };
         * 
         * $(".selector").dialog2(options);
         * 
         * or 
         * 
         * $(".selector").dialog2("method", arguments);
         */
        dialog2: function() {
            var args = $.makeArray(arguments);
            var arg0 = args.shift();
            
            var dialog = $(this).data("dialog2");
            if (!dialog) {
                var options = $.extend(true, {}, $.fn.dialog2.defaults);
                if ($.isPlainObject(arg0)) {
                    options = $.extend(true, options, arg0);
                }
                
                dialog = new Dialog2(this, options);
                dialog.handle().data("dialog2", dialog);
            } else {
                if (typeof arg0 == "string") {
                    var method = dialog[arg0];
                    if (method) {
                        var result = dialog[arg0].apply(dialog, args);
                        return (result == dialog ? dialog.handle() : result);
                    } else {
                        throw new __error("Unknown API method '" + arg0 + "'");
                    }
                } else 
                if ($.isPlainObject(arg0)) {
                    dialog.options(arg0);
                } else {
                    throw new __error("Unknown API invocation: " + arg0 + " with args " + args);
                }
            }

            return dialog.handle();
        }
    });
    
    // Support for close key [ESCAPE] press
    $(document).ready(function() {
        $(document).keyup(function(event) {
            if (event.which == 27) {
                $(this).find(".modal > .opened").each(function() {
                    var dialog = $(this);
                    if (dialog.dialog2("options").closeOnEscape) {
                        dialog.dialog2("close");
                    }
                });
            }
        });
    });
    
    /**
     * Random helper functions; today: 
     * Returns true if value is a boolean
     * 
     * @param value the value to check
     * @return true if the value is a boolean
     */
    function __boolean(value) {
        return typeof value == "boolean";
    };
    
    /**
     * Creates a dialog2 error with the given message
     * 
     * @param errorMessage stuff to signal the user
     * @returns the error object to be thrown
     */
    function __error(errorMessage) {
        new Error("[jquery.dialog2] " + errorMessage);
    };
    
    /**
     * Dialog2 plugin defaults (may be overriden)
     */
    $.fn.dialog2.defaults = {
        autoOpen: true, 
        closeOnOverlayClick: true, 
        removeOnClose: true, 
        showCloseHandle: true, 
        initialLoadText: "", 
        closeOnEscape: true
    };
    
    /***********************************************************************
     * Localization
     ***********************************************************************/
    
    $.fn.dialog2.localization = {
        "de": {
            cancel: "Abbrechen"
        },
        "en": {
            cancel: "Cancel"
        }
    };
    
    var lang = $.fn.dialog2.localization["en"];
    
    /**
     * Localizes a given key using the selected language
     * 
     * @param key the key to localize
     * @return the localization of the key or the key itself if it could not be localized.
     */
    function localize(key) {
        return lang[key.toLowerCase()] || key;
    };
    
    /**
     * Creates a localized button and returns the buttons object specifying 
     * a number of buttons. May pass a buttons object to add the button to.
     * 
     * @param name to be used as a button label (localized)
     * @param functionOrOptions function or options to attach to the button
     * @param buttons object to attach the button to (may be null to create new one)
     * 
     * @returns buttons object or new object with the button added
     */
    function localizedButton(name, functionOrOptions, buttons) {
        buttons = buttons || {};
        buttons[localize(name)] = functionOrOptions;
        return buttons;
    };
    
    /**
     * Expose some localization helper methods via $.fn.dialog2.localization
     */
    $.extend($.fn.dialog2.localization, {
        localizedButton: localizedButton, 
        get: localize, 
        
        setLocale: function(key) {
            var localization = $.fn.dialog2.localization[key];

            if (localization == null) {
                throw new Error("No localizaton for language " + key);
            } else {
                lang = localization;
            }
        }
    });
    
    /**
     * Returns a localized cancel button
     * @return a buttons object containing a localized cancel button 
     *         (including its close functionality)
     */
    function localizedCancelButton() {
        return localizedButton("close", function() {
            $(this).dialog2("close");
        });
    };
    
    /***********************************************************************
     * Integration with jquery.controls
     ***********************************************************************/
    
    /**
     * Register opening of a dialog on annotated links
     * (works only if jquery.controls plugin is installed). 
     */
    if ($.fn.controls && $.fn.controls.bindings) {
        $.extend($.fn.controls.bindings, {
            "a.open-dialog": function() {
                var a = $(this).removeClass("open-dialog");
                
                var id = a.attr("rel");
                var content = a.attr("href");
                
                var options = {
                    modal: true
                };

                var element;

                if (id) {
                    var e = $("#" + id);
                    if (e.length) element = e;
                }

                if (!element) {
                    if (id) {
                        options.id = id;
                    }
                }
                
                if (a.attr("data-dialog-class")) {
                    options.modalClass = a.attr("data-dialog-class");
                }
                
                if (a.attr("title")) {
                    options.title = a.attr("title");
                }
                
                $.each($.fn.dialog2.defaults, function(key, value) {
                    if (a.attr(key)) {
                        options[key] = a.attr(key) == "true";
                    }
                });
                
                if (content && content != "#") {
                    options.content = content;
                    
                    a.click(function(event) {
                        event.preventDefault();
                        $(element || "<div></div>").dialog2(options);
                    });
                } else {
                    options.removeOnClose = false;
                    options.autoOpen = false;
                    
                    element = element || "<div></div>";
                    
                    // Pre initialize dialog
                    $(element).dialog2(options);
                    
                    a.attr("href", "#")
                     .click(function(event) {
                         event.preventDefault();
                         $(element).dialog2("open");
                     });
                }
            }
        });
    };
})(jQuery);