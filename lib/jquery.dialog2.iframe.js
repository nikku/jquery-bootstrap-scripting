/*
* jQuery Dialog2 IFrame
* 
* Licensed under the MIT license 
* http://www.opensource.org/licenses/mit-license.php 
* 
* @version: 1.0.1 (17/05/2012)
* 
* @requires jQuery >= 1.4 
* 
* @requires jQuery.dialog2 plugin >= 1.1
* 
* @requires jQuery.query plugin >= 2.1.7
* 
* @author Jorge Barnaby (jorge.barnaby {at} gmail.com)
*/
(function ($) {

    /*
    * Shows a web page (using iframe) in a jQuery dialog2 (Bootstrap style).
    *
    */
    $.fn.dialog2IFrame = function (options) {
        options = $.extend({}, $.fn.dialog2IFrame.defaults, options);
        $(this).click(function (e) {
            e.preventDefault();
            var idDialogOuter = "dialog-iframe-outer";
            //Creates the div and iframe on body to contain load the URL
            if ($('#' + idDialogOuter).length == 0) {
                $('<div id="' + idDialogOuter + '"><iframe frameborder="0" /></div>')
                    .appendTo(document.body).hide();
            }

            var mainWin = window;
            var btn = this;
            var $btn = $(btn);
            var dialogOuter = $('#' + idDialogOuter);
            var dialogFrame = dialogOuter.find('iframe');
            var url = btn.href;

            if (options.appendParamUrl) {
                // Appends &iframe=true to url
                url = btn.protocol + "//" +
                    // Add trailing '/'' if not exists
                    (btn.host.charAt(this.host.length - 1) != '/' ? btn.host + '/' : btn.host) +
                    // Remove starting '/'' if exists
                    (btn.pathname.charAt(0) == '/' ? btn.pathname.substr(1, btn.pathname.length - 1) : btn.pathname) +
                    $.query.load(btn.href).set("iframe", "true").copy();
            }

            // Adds URL to iframe src
            dialogFrame.attr('src', url);

            var h = options.height;
            dialogFrame.css('height', h);

            dialogOuter.css('overflow', 'hidden');
            dialogOuter.css('padding', '0 10px');
            dialogOuter.css('margin', '0');

            var dialog = dialogOuter.dialog2(
                {
                    title: $btn.attr('title'),
                    buttons: {
                        Close: {
                            click: function () {
                                options.close();
                                $(this).dialog2('close');
                                // If caller has the CSS Class 'reload-on-close' or
                                // reloadOnClose option is true,
                                // the main page will be reloaded on close.
                                if ($btn.hasClass('reload-on-close') || options.reloadOnClose) {
                                    mainWin.location.reload();
                                }
                            }
                        }
                    },
                    autoOpen: true,
                    closeOnOverlayClick: false,
                    closeOnEscape: false,
                    removeOnClose: true,
                    showCloseHandle: false,
                    initialLoadText: "Loading..."
                })
                .find('iframe').width($('.modal').width() - 20) // Sets the IFrame width to the same as the modal;
        });
    }

    $.fn.dialog2IFrame.defaults = {
        height: 300,
        // Appends &iframe=true to URL opened on IFrame
        appendParamUrl: false,
        // Reloads main page when modal is closed
        reloadOnClose: false,
        close: function () {
            return true;
        }
    };
})(jQuery);