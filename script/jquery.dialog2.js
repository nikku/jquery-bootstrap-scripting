/*
 * Dialog2: Yet another dialog plugin for jQuery.
 * 
 * This time based on bootstrap styles with some nice ajax control features, 
 * zero dependencies to jQuery.UI and basic options to control it.
 * 
 * Licensed under the MIT license 
 * http://www.opensource.org/licenses/mit-license.php 
 * 
 * @version: 1.0.1 (05/09/2011)
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
        });

        // Make submitable for an ajax form 
        // if the jquery.form plugin is provided
        if ($.fn.ajaxForm) {
            var form = $("form.ajax", dialog).ajaxForm({
                target: dialog,
                success: $.proxy(__ajaxCompleteTrigger, dialog),
                beforeSubmit: $.proxy(__ajaxStartTrigger, dialog), 
                error: function() {
                    throw new Error("[jquery.dialog2] form submit failed: " + $.makeArray(arguments));
                }
            });

            // Add submit = OK button to dialog
            // if submitable form is found 
            var submit = form
                            .find("input[type=submit]")
                                .parent()
                                .hide()
                            .end();

            if (form.length > 0 && submit.length > 0) {
                dialog.dialog2("addButton", submit.attr("value") || "Submit", { 
                    primary: true, click: function() {
                        form.submit();
                    }
                });
            }
        }
        
        // set title if content contains a h1 element
        var titleElement = dialog.find("h1").hide();
        if (titleElement.length > 0) {
            dialog.dialog2("options", { title: titleElement.text() });
        }

        // Focus first focusable element in dialog
        dialog
            .find("input, select, textarea, button")
                .eq(0)
                    .focus();
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
     * Cached functions (to be memorized for some reason)
     */
    var __removeDialog = function(event) {$(this).remove();};
    
    var __DIALOG_HTML = "<div class='overlay modal-overlay'>" + 
        "<div class='modal' style='position: relative; top: auto; left: auto; margin: 10% auto; z-index: 1'>" + 
        "<div class='modal-header'>" +
        "<h3></h3><span class='loader'></span>" + 
        "<a href='#' class='close'></a>" + 
        "</div>" + 
        "<div class='modal-body'>" + 
        "</div>" + 
        "<div class='modal-footer'>" + 
        "</div>" + 
        "</div>" + 
        "</div>";
    
    /**
     * Public API methods exposed by the dialog2 plugin
     */
    var dialog2 = {
        close: function() {
            var dialog = $(this);
            var overlay = dialog.parents(".modal-overlay");
            
            overlay.hide();
            dialog
                .trigger("dialog2.closed")
                .removeClass("opened");
        }, 
        open: function() {
            var dialog = $(this);
            
            if (!dialog.is(".opened")) {
                dialog
                    .trigger("dialog2.before-open")
                    .parents(".modal-overlay")
                        .show()
                        .end()
                    .addClass("opened")
                    .trigger("dialog2.opened");
            }
        }, 
        addButton: function(name, options) {          
            addDialogButton(this, name, options);
        }, 
        removeButton: function(name) {
            var footer = $(this).parent().find(".modal-footer");
                
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
            var overlay = self.parents(".modal-overlay");
            
            if (options.title) {
                $(".modal-header h3", overlay).text(options.title);
            }
            
            if (options.buttons) {
                $(".modal-footer", overlay).empty();
                
                $.each(options.buttons, function(name, value) {
                    addDialogButton(self, name, value);
                });
            }
            
            overlay.unbind("click");
            
            if (options.closeOnOverlayClick) {
                overlay.click(function(event) {
                    if ($(event.target).is(".modal-overlay")) {
                        self.dialog2("close");
                    }
                });
            }
            
            self.unbind("dialog2.closed", __removeDialog);
            
            if (options.removeOnClose) {
                self.bind("dialog2.closed", __removeDialog);
            }
            
            if (options.autoOpen) {
                self.dialog2("open");
            }
            
            if (options.content) {
                self.dialog2("load", options.content);
            }
            
            return this;
        }
    };
    
    /**************************************************************************
     * Private utility methods                                                *
     **************************************************************************/
    
    function addDialogButton(dialog, name, options) {
        var callback = $.isFunction(options) ? options : options.click;
        
        var footer = $(dialog).parent().find(".modal-footer");

        var button = $("<a href='#' class='btn'></a>")
                            .text(name)
                            .click(function(event) {
                                callback.apply(dialog, [event]);
                                event.preventDefault();
                            });
        
        if (options.primary) {
            button.addClass("primary");
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
            var overlay = $(__DIALOG_HTML).appendTo("body");
            
            $(".modal-header a.close", overlay)
                .text(unescape("%D7"))
                .click(function() {
                    $(this)
                        .parents(".modal")
                        .find(".modal-body")
                            .dialog2("close");
                });
            
            dialog = $(".modal-body", overlay);
            
            // Create dialog body from current jquery selection
            // If specified body is a div element and only one element is 
            // specified, make it the new modal dialog body
            // Allows us to do something like this 
            // $('<div id="foo"></div>').dialog2(); $("#foo").dialog2("open");
            if (selection.is("div") && selection.length == 1) {
                dialog.replaceWith(selection);
                selection.addClass("modal-body");
                dialog = selection;
            }
            // If not, append current selection to dialog body
            else {
                dialog.append(selection);
            }
            
            dialog.bind("dialog2.ajax-start", function() {
                $(this).dialog2("options", { buttons: localizedCancelButton() })
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
            if (dialog2[arg0]) {
                return dialog2[arg0].apply(this, args);
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
        removeOnClose: true
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
            "a.ajax": function() {
                $(this).click(function(event) {
                    var a = $(this);
                    
                    var options = {
                        modal: true,
                        content: a.attr("href"),
                        id: a.attr("rel"),
                        
                        buttons: localizedCancelButton()
                    };

                    if (a.hasClass("open-lazy")) {
                        options.autoOpen = false;
                    }

                    if (a.attr("title")) {
                        options.title = a.attr("title");
                    }
                    
                    $("<div></div>").dialog2(options);
                    event.preventDefault();
                });
            }
        });
    };
})(jQuery);