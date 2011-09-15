/*
 * Dialog2: Yet another dialog plugin for jQuery.
 * 
 * This time based on bootstrap styles with some nice ajax control features, 
 * zero dependencies to jQuery.UI and basic options to control it.
 * 
 * Licensed under the MIT license 
 * http://www.opensource.org/licenses/mit-license.php 
 * 
 * @version: 1.1.0 (15/09/2011)
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
     * Returns true if value is a boolean
     */
    function __boolean(value) {
        return typeof value == "boolean";
    };
    
    /**
     * Ajaxifies the dialogs contents, 
     * creating ajax forms and ajax links on .ajax annotated elements
     * 
     * @param dialog to be ajaxified
     */
    function __ajaxify(dialog) {
        dialog.find("a.ajax").click(function(event) {
            var url = $(this).attr("href");
            
            $(dialog).dialog2("load", url);
            event.preventDefault();
        }).removeClass("ajax");
        
        // Make submitable for an ajax form 
        // if the jquery.form plugin is provided
        if ($.fn.ajaxForm) {
            $("form.ajax", dialog).ajaxForm({
                target: dialog,
                success: $.proxy(__ajaxCompleteTrigger, dialog),
                beforeSubmit: $.proxy(__ajaxStartTrigger, dialog), 
                error: function() {
                    throw new Error("[jquery.dialog2] form submit failed: " + $.makeArray(arguments));
                }
            });
        }
        
        // Add buttons to dialog for all buttons found within 
        // a .actions area inside the dialog
        var actions = $(".actions", dialog).hide();
        var buttons = actions.find("input[type=submit], input[type=button], input[type=reset], button, .btn");
        
        // Add buttons in reverse order, as they will appear in the
        // desired order on the dialog then
        buttons.each(function() {
            var button = $(this);
            var name = button.is("input") ? button.val() || button.attr("type") : button.text();
            
            dialog.dialog2("addButton", name, {
                primary: button.is("input[type=submit]"),
                type: button.attr("class"), 
                click: function(event) {
                    // simulate click on the original button
                    // to not destroy any event handlers
                    button.click();
                    
                    if (button.is(".close-dialog")) {
                        $(dialog).dialog2("close");
                    }
                }
            });
        });
        
        
        // set title if content contains a h1 element
        var titleElement = dialog.find("h1").hide();
        if (titleElement.length > 0) {
            dialog.dialog2("options", {title: titleElement.text()});
        }
        
        __focus(dialog);
    };
    
    /**
     * Callback passed to load / form submit actions as a complete trigger
     */
    function __ajaxCompleteTrigger() {
        $(this).trigger("dialog2.ajax-complete");
    };
    
    function __ajaxStartTrigger() {
        $(this).trigger("dialog2.ajax-start");
    };
    
    /**
     * Put focus on the dialog
     */
    function __focus(dialog) {
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
    };
    
    function __getOverlay(dialog) {
        return dialog.parent().prev(".modal-backdrop");
    }
    
    /**
     * Cached functions (to be memorized for some reason)
     */
    var __removeDialog = function(event) {
        var dialog = $(this);
        __getOverlay(dialog).remove();
        dialog.remove();
    };
    
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
     * Public API methods exposed by the dialog2 plugin
     */
    var dialog2 = {
        close: function() {
            var dialog = $(this);
            __getOverlay(dialog).hide();
            
            dialog
                .parent().hide().end()
                .trigger("dialog2.closed")
                .removeClass("opened");
        }, 
        open: function() {
            var dialog = $(this);
            
            if (!dialog.is(".opened")) {
                __getOverlay(dialog).show();
                
                dialog
                    .trigger("dialog2.before-open")
                    .addClass("opened")
                    .parent().show().end()
                    .trigger("dialog2.opened");
                    
                __focus(dialog);
            }
        }, 
        addButton: function(name, options) {          
            addDialogButton(this, name, options);
        }, 
        removeButton: function(name) {
            var footer = $(this).siblings(".modal-footer");
                
            footer
                .find("a.btn")
                .filter(function(i, e) {return $(e).text() == name;})
                .remove();
        }, 
        load: function(url) {
            $(this).trigger("dialog2.ajax-start")
                   .load(url, $.proxy(__ajaxCompleteTrigger, this));
        },
        options: function(options) {
            var self = $(this);
            var handle = self.parent();
            
            if (options.title) {
                $(".modal-header h3", handle).text(options.title);
            }
            
            if (options.buttons) {
                $(".modal-footer", handle).empty();
                
                $.each(options.buttons, function(name, value) {
                    addDialogButton(self, name, value);
                });
            }
            
            if (__boolean(options.closeOnOverlayClick)) {
                var overlay = __getOverlay(self);
                overlay.unbind("click");

                if (options.closeOnOverlayClick) {
                    overlay.click(function(event) {
                        if ($(event.target).is(".modal-backdrop")) {
                            self.dialog2("close");
                        }
                    });
                }
            }
            
            if (__boolean(options.showCloseHandle)) {
                var closeHandleMode = options.showCloseHandle ? "show" : "hide";
                $(".modal-header .close", handle)[closeHandleMode]();
            }
            
            if (__boolean(options.removeOnClose)) {
                self.unbind("dialog2.closed", __removeDialog);
                
                if (options.removeOnClose) {
                    self.bind("dialog2.closed", __removeDialog);
                }
            }
            
            if (options.autoOpen === true) {
                self.dialog2("open");
            }
            
            if (options.content) {
                self.empty().dialog2("load", options.content);
            }
            
            return this;
        }
    };
    
    /**************************************************************************
     * Private utility methods                                                *
     **************************************************************************/
    
    function addDialogButton(dialog, name, options) {
        var callback = $.isFunction(options) ? options : options.click;
        
        var footer = $(dialog).siblings(".modal-footer");

        var button = $("<a href='#' class='btn'></a>")
                            .text(name)
                            .click(function(event) {
                                callback.apply(dialog, [event]);
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
    };
    
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
    function checkCreateDialog(element, options) {

        var selection = $(element);
        var dialog;
        
        var created = false;
        
        if (!selection.is(".modal-body")) {
            var overlay = $('<div class="modal-backdrop"></div>').appendTo("body").hide();
            var handle = $(__DIALOG_HTML).appendTo("body");
            
            $(".modal-header a.close", handle)
                .text(unescape("%D7"))
                .click(function(event) {
                    event.preventDefault();
                    
                    $(this)
                        .parents(".modal")
                        .find(".modal-body")
                            .dialog2("close");
                });
            
            dialog = $(".modal-body", handle);
            
            // Create dialog body from current jquery selection
            // If specified body is a div element and only one element is 
            // specified, make it the new modal dialog body
            // Allows us to do something like this 
            // $('<div id="foo"></div>').dialog2(); $("#foo").dialog2("open");
            if (selection.is("div") && selection.length == 1) {
                dialog.replaceWith(selection);
                selection.addClass("modal-body").show();
                dialog = selection;
            }
            // If not, append current selection to dialog body
            else {
                dialog.append(selection);
            }
            
            dialog.bind("dialog2.ajax-start", function() {
                $(this).dialog2("options", {buttons: localizedCancelButton()})
                       .parent().addClass("loading");
            });
            
            dialog.bind("dialog2.ajax-complete", function() {
                var self = $(this);
                
                self.parent().removeClass("loading");
                __ajaxify(self);
            });
            
            if (options.id) {
                dialog.attr("id", options.id);
            }
            
            // we just created this one
            created = true;
        } else {
            dialog = selection;
        }
        
        // Apply options to make title and stuff shine
        dialog.dialog2("options", options);
        
        // We will ajaxify its contents when its new
        // aka apply ajax styles in case this is a inpage dialog
        if (created) {
            __ajaxify(dialog);
        }
                
        return dialog;
    };
    
    /**
     * Localizes a given key using the selected language
     */
    function localize(key) {
        return lang[key];
    };
    
    /**
     * Returns a localized cancel button
     */
    function localizedCancelButton() {
        var option = {};
        option[localize("cancel")] = function() {
            $(this).dialog2("close");
        };
        
        return option;
    };
    
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
            if (typeof arg0 == "string") {
                var method = dialog2[arg0];
                if (method) {
                    return dialog2[arg0].apply(this, args);
                } else {
                    throw new Error("Unknown API method '" + arg0 + "' for jquery.dialog2 plugin");
                }
            } else {
                var options = $.extend(true, {}, $.fn.dialog2.defaults);

                if ($.isPlainObject(arg0)) {
                    options = $.extend(true, options, arg0);
                }
                
                return checkCreateDialog(this, options);
            }
        }
    });
    
    $.fn.dialog2.defaults = {
        autoOpen: true, 
        closeOnOverlayClick: true, 
        removeOnClose: true, 
        showCloseHandle: true
    };
    
    $.fn.dialog2.localization = {
        "de": {
            cancel: "Abbrechen"
        },         
        "en": {
            cancel: "Cancel"
        }
    };
    
    var lang = $.fn.dialog2.localization["en"];
    
    $.fn.dialog2.localization.setDefault = function(key) {
        var localization = $.fn.dialog2.localization[key];
        
        if (localization == null) {
            throw new Error("No localizaton for language " + key);
        } else {
            lang = localization;
        }
    };
    
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