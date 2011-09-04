/*
 * Dialog2: Yet another dialog plugin for jQuery.
 * 
 * This time based on bootstrap styles with some nice ajax control features, 
 * zero dependencies to jQuery.UI and basic options to control it.
 * 
 * Licensed under the MIT license 
 * http://www.opensource.org/licenses/mit-license.php 
 * 
 * @version: 1.0 (04/09/2011)
 * 
 * @requires jQuery >= 1.4 
 * 
 * @requires jQuery.form plugin (http://jquery.malsup.com/form/) >= 2.8 for ajax form submit 
 * @requires jQuery.controls plugin (https://github.com/Nikku/jquery-controls) >= 0.9 for ajax link binding support
 * 
 * @requires bootstrap styles (twitter.github.com/bootstrap) to look nice
 * 
 * @author nico.rehwaldt (nire-nokin@gmail.com)
 */
(function($) {
    
    /** 
     * JQuery extension to load an element without cache; 
     * just slightly modified version of original jQuery 
     * implementation
     */
    $.fn.loadWithoutCache = function( url, params, callback ) {
        // Don't do a request if no elements are being requested
        if ( !this.length ) {
            return this;
        }

        var off = url.indexOf( " " );
        if ( off >= 0 ) {
            var selector = url.slice( off, url.length );
            url = url.slice( 0, off );
        }

        // Default to a GET request
        var type = "GET";

        // If the second parameter was provided
        if ( params ) {
            // If it's a function
            if ( jQuery.isFunction( params ) ) {
                // We assume that it's the callback
                callback = params;
                params = undefined;

            // Otherwise, build a param string
            } else if ( typeof params === "object" ) {
                params = jQuery.param( params, jQuery.ajaxSettings.traditional );
                type = "POST";
            }
        }

        var self = this;

        // Request the remote document
        jQuery.ajax({
            url: url,
            type: type,
            dataType: "html",
            cache: false, 
            data: params,
            // Complete callback (responseText is used internally)
            complete: function( jqXHR, status, responseText ) {
                // Store the response as specified by the jqXHR object
                responseText = jqXHR.responseText;
                // If successful, inject the HTML into all the matched elements
                if ( jqXHR.isResolved() ) {
                    // #4825: Get the actual response in case
                    // a dataFilter is present in ajaxSettings
                    jqXHR.done(function( r ) {
                        responseText = r;
                    });
                    // See if a selector was specified
                    self.html( selector ?
                        // Create a dummy div to hold the results
                        jQuery("<div>")
                            // inject the contents of the document in, removing the scripts
                            // to avoid any 'Permission Denied' errors in IE
                            .append(responseText.replace(rscript, ""))

                            // Locate the specified elements
                            .find(selector) :

                        // If not, just inject the full result
                        responseText );
                }

                if ( callback ) {
                    self.each( callback, [ responseText, status, jqXHR ] );
                }
            }
        });

        return this;
    };
    
    /**
     * Public api for dialog2
     */
    var dialog2 = {
        close: function() {
            var dialog = $(this);
            dialog
                .trigger("dialog2-before-close")
                .parents(".overlay")
                    .hide()
                    .end()
                .trigger("dialog2-closed")
                .parents(".overlay")
                    .remove();
        }, 
        open: function() {
            var dialog = $(this);
            
            if (!dialog.is(".opened")) {
                dialog
                    .trigger("dialog2-before-open")
                    .parents(".overlay")
                        .show()
                        .end()
                    .addClass("opened")
                    .trigger("dialog2-opened");
            }
        }, 
        addButton: function(name, options) {
            var footer = $(this)
                .parents(".modal")
                .find(".modal-footer");
            
            addLightboxButton(footer, name, options);
        }, 
        removeButton: function(name) {
            var footer = $(this)
                .parents(".modal")
                .find(".modal-footer");
                
            footer
                .find("a.btn")
                .filter(function(i, e) { return $(e).text() == name; })
                .remove();
        }, 
        options: function(options) {
            if (options.autoOpen) {
                $(this).dialog2("open");
            }
            
            var handle = $(this).parents(".overlay");
            if (options.title) {
                $(".modal-header h3", handle).text(options.title);
            }
            
            if (options.buttons) {
                var footer = $(".modal-footer", handle).empty();
                
                $.each(options.buttons, function(name, value) {
                    addLightboxButton(footer, name, value);
                });
            }
        }
    };
    
    function addLightboxButton(footer, name, options) {
        var callback = $.isFunction(options) ? options : options.click;
        
        var button = $("<a href='#' class='btn'></a>")
                            .text(name)
                            .click(callback);
                            
        if (options.primary) {
            button.addClass("primary");
        }
        
        footer.append(button);
    };
    
    /**************************************************************************
     * Private utility methods                                                *
     **************************************************************************/
    function checkCreateLightBox(element, options) {
        var html = "<div class='overlay'>" + 
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
         * // selector is a dialog? Does essentially nothing
         * $(".selector").dialog2();
         * 
         * // .selector known?
         * // creates a dialog wrapped around .selector
         * $(".selector").dialog2();
         * 
         * // creates a dialog wrapped around .selector with id #foo
         * $(".selector").dialog2({id: "foo"});
         * 
         * // #foo not known? Creates a new dialog with id foo
         * $("#foo").dialog2({id: "foo"});
         */
        var selection = $(element);
        var dialog;
        
        if (!selection.is(".modal-body")) {
            var overlay = $(html).appendTo("body");
            
            dialog = overlay
                .find(".modal-header a.close")
                    .click(function() {
                        $(this)
                            .parents(".modal")
                            .find(".modal-body")
                                .dialog2("close");
                    })
                    .text(unescape("%D7"))
                    .end()
                .find(".modal-body")
                    .append(selection.contents());
            
            // Remove element the content originated from
            selection.remove();            

            if (options.closeOnOverlayClick) {
                overlay.click(function(event) {
                    if ($(event.target).is(".overlay")) {
                        dialog.dialog2("close");
                    }
                });
            }
            
            dialog
                .ajaxSend(function() {
                    $(this)
                        .trigger("dialog2.before-load")
                        .dialog2({ buttons: localizedCancelButton() })
                        .parent()
                            .addClass("loading"); 
                })
                .ajaxComplete(function() {
                    $(this)
                        .trigger("dialog2.load-complete")
                        .parent()
                            .removeClass("loading");
                });
            
            if (options.id) {
                dialog.attr("id", options.id);
            }
            
        } else {
            dialog = selection;
        }

        if (options.content) {
            dialog.loadWithoutCache(options.content, loadComplete);
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
    
    /**
     * Load complete handler function to make the whole ajax stuff work
     */
    function loadComplete() {
        var dialog = $(this);
        
        dialog.find("a.ajax").click(function(event) {
            var url = $(this).attr("href");
            
            event.preventDefault();
            dialog
                .loadWithoutCache(url, function(data, status, request) {
                    $(dialog).html(data);
                    loadComplete.call(dialog, data, status, request);
                });
        });

        if ($.fn.ajaxForm) {
            // Add submit = OK button to dialog2
            // if submitable form is found
            var form = $("form.ajax", dialog).ajaxForm({
                target: dialog,
                success: loadComplete, 
                cache: false
            });

            var submit = form
                            .find("input[type=submit]")
                                .parent()
                                .hide()
                            .end();

            if (form.length > 0 && submit.length > 0) {
                dialog.dialog2("addButton", submit.attr("value"), { 
                    primary: true, click: function() {
                        form.submit();
                    }
                });
            }
        }
        
        // set title if content contains a h1 element
        var titleElement = $(dialog).find("h1").hide();
        if (titleElement.length > 0) {
            $(dialog).dialog2({title: titleElement.text()});
        }

        // Focus first focusable element in dialog
        $(dialog)
            .find("input, select, textarea, button")
                .eq(0)
                    .focus();
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
            }
            
            var options = {};
            
            if ($.isPlainObject(arg0)) {
                options = $.extend(true, {}, $.fn.dialog2.defaults, arg0);
            }
            
            return this.each(function() {
                var e = checkCreateLightBox(this, options);
                $(e).dialog2("options", options);
            });
        }
    });
    
    $.fn.dialog2.defaults = {
        autoOpen: true, 
        closeOnOverlayClick: true
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
                var a = $(this);
                var dialog = $("<div></div>");
                
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

                a.click(function(event) {
                    event.preventDefault();
                    dialog.dialog2(options);
                });
            }
        });
    };
})(jQuery);