/*
 * Dialog2: Yet another dialog plugin for jQuery.
 * 
 * This time based on bootstrap styles with some nice ajax control features, 
 * zero dependencies to jQuery.UI and basic options to control it.
 * 
 * Licensed under the MIT license 
 * http://www.opensource.org/licenses/mit-license.php 
 * 
 * @version: 2.0.0 (22/03/2012)
 * 
 * @requires jQuery >= 1.4 
 * 
 * @requires jQuery.form plugin (http://jquery.malsup.com/form/) >= 2.8 for ajax form submit 
 * @requires jQuery.controls plugin (https://github.com/Nikku/jquery-controls) >= 0.9 for ajax link binding support
 * 
 * @requires bootstrap styles (twitter.github.com/bootstrap) in version 2.x to look nice
 * 
 * @author nico.rehwaldt
 */

/**
 * This script file extends the plugin to provide helper functions
 * alert(), confirm() and prompt()
 * 
 * Thanks to ulrichsg for the contribution
 */
(function($) {
    var localizedButton = $.fn.dialog2.localization.localizedButton;
    
    var __helpers = {
        
        /**
         * Creates an alert displaying the given message.
         * Will call options.close on close (if specified).
         * 
         *   $.fn.dialog2.alert("This dialog is non intrusive", { 
         *       close: function() {
         *           alert("This one is!");
         *       }
         *   });
         * 
         * @param message to be displayed as the dialog body
         * @param options (optional) to be used when creating the dialog
         */
        alert: function(message, options) {
            options = $.extend({}, options);
            var labels = $.extend({}, $.fn.dialog2.helpers.defaults.alert, options);
            
            var dialog = $("<div />");
            
            var closeCallback = options.close;
            delete options.close;
            
            var buttons = localizedButton(labels.buttonLabelOk, __closeAndCall(closeCallback, dialog));
            
            return __open(dialog, message, labels.title, buttons, options);
        }, 
        
        /**
         * Creates an confirm dialog displaying the given message.
         * 
         * Will call options.confirm on confirm (if specified).
         * Will call options.decline on decline (if specified).
         * 
         *   $.fn.dialog2.confirm("Is this dialog non intrusive?", {
         *       confirm: function() { alert("You said yes? Well... no"); }, 
         *       decline: function() { alert("You said no? Right choice!") }
         *   });
         * 
         * @param message to be displayed as the dialog body
         * @param options (optional) to be used when creating the dialog
         */
        confirm: function(message, options) {
            options = $.extend({}, options);
            var labels = $.extend({}, $.fn.dialog2.helpers.defaults.confirm, options);
            
            var dialog = $("<div />");
            
            var confirmCallback = options.confirm;
            delete options.confirm;
            
            var declineCallback = options.decline;
            delete options.decline;
            
            var buttons = {};
            localizedButton(labels.buttonLabelYes, __closeAndCall(confirmCallback, dialog), buttons);
            localizedButton(labels.buttonLabelNo, __closeAndCall(declineCallback, dialog), buttons);
            
            return __open(dialog, message, labels.title, buttons, options);
        },
        
        /**
         * Creates an prompt dialog displaying the given message together with 
         * an element to input text in.
         * 
         * Will call options.ok on ok (if specified).
         * Will call options.cancel on cancel (if specified).
         * 
         *   $.fn.dialog2.prompt("What is your age?", {
         *       ok: function(event, value) { alert("Your age is: " + value); }, 
         *       cancel: function() { alert("Better tell me!"); }
         *   });
         * 
         * @param message to be displayed as the dialog body
         * @param options (optional) to be used when creating the dialog
         */
        prompt: function(message, options) {
            // Special: Dialog has to be closed on escape or multiple inputs
            // with the same id will be added to the DOM!
            options = $.extend({}, options, {closeOnEscape: true});
            var labels = $.extend({}, $.fn.dialog2.helpers.defaults.prompt, options);
            
            var inputId = 'dialog2.helpers.prompt.input.id';
            var input = $("<input type='text' class='span6' />")
                                .attr("id", inputId)
                                .val(options.defaultValue || "");
                                
            var html = $("<form class='form-stacked'></form>");
            html.append($("<label/>").attr("for", inputId).text(message));
            html.append(input);
            
            var dialog = $("<div />");
            
            var okCallback;
            if (options.ok) {
                var fn = options.ok;
                okCallback = function(event) { fn.call(dialog, event, input.val()); };
            }
            delete options.ok;
            
            var cancelCallback = options.cancel;
            delete options.cancel;
            
            var buttons = {};
            localizedButton(labels.buttonLabelOk, __closeAndCall(okCallback, dialog), buttons);
            localizedButton(labels.buttonLabelCancel, __closeAndCall(cancelCallback, dialog), buttons);
            
			// intercept form submit (on ENTER press)
			html.bind("submit", __closeAndCall(okCallback, dialog));
			
            __open(dialog, html, labels.title, buttons, options);
        }, 
        
        /**
         * Default helper options
         */
        defaults: {}
    };
    
    function __closeAndCall(callback, dialog) {
        return $.proxy(function(event) {
			event.preventDefault();
			
            $(this).dialog2("close");
            
            if (callback) {
                callback.call(this, event);
            }
        }, dialog || this);
    };
    
    function __open(e, message, title, buttons, options) {
        options.buttons = buttons;
        options.title = title;
        
        return e.append(message).dialog2(options);
    };
    
    $.extend(true, $.fn.dialog2, {
        helpers: __helpers
    });
    
    $.extend($.fn.dialog2.helpers.defaults, {
        alert: {
            title: 'Alert', 
            buttonLabelOk: 'Ok' 
        }, 
        
        prompt: {
            title: 'Prompt',
            buttonLabelOk: 'Ok', 
            buttonLabelCancel: 'Cancel' 
        }, 
        
        confirm: {
            title: 'Confirmation',
            buttonLabelYes: 'Yes',
            buttonLabelNo: 'No'
        }
    });
})(jQuery);
