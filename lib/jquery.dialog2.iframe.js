/*
* jQuery Dialog2 IFrame
* 
* Licensed under the MIT license 
* http://www.opensource.org/licenses/mit-license.php 
* 
* @version: 1.0.2 (08/03/2013)
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

            var mainWin = window;
            var btn = this;
            var $btn = $(btn);
            var $dialogOuter = $('#' + idDialogOuter).length ?
                $('#' + idDialogOuter) :
                $('<div id="' + idDialogOuter + '"></div>').hide().appendTo(document.body);
            var $dialogFrame = $('iframe', $dialogOuter).length ?
                $('iframe', dialogOuter) :
                $('<iframe frameborder="0" />').appendTo($dialogOuter);
            var url = btn.href;

            if (options.appendParamUrl) {
                // Appends &iframe=true to url
                url = btn.protocol + "//" +
                    // Add trailing '/'' if not exists
                    (btn.host.charAt(btn.host.length - 1) != '/' ? btn.host + '/' : btn.host) +
                    // Remove starting '/'' if exists
                    (btn.pathname.charAt(0) == '/' ? btn.pathname.substr(1, btn.pathname.length - 1) : btn.pathname) +
                    $.query.load(btn.href).set("iframe", "true").copy();
            }

            // Adds URL to iframe src
            $dialogFrame.attr('src', url);

            $dialogOuter.css('overflow', 'hidden').css('padding', '0').css('margin', '0');

            $dialogOuter.dialog2(
            {
                title: $btn.attr('title'),
                /*buttons: {
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
                },*/ // TODO: Temporary removal
                autoOpen: true,
                closeOnOverlayClick: options.closeOnOverlayClick,
                closeOnEscape: options.closeOnEscape,
                removeOnClose: true,
                showCloseHandle: options.showCloseHandle,
                initialLoadText: "Loading..."
            });

            var $dialog = $dialogOuter.parent();

            $dialog.addClass(options.additionalClass);

            // Removes footer if empty
            $footer = $dialog.find('.modal-footer');
            console.log($footer.text().length);
            if ($footer.text().length == 0) {
                $footer.remove();
            }

            // Sets the iframe width and height to the same as the modal (must be done at the end)
            $dialogFrame.width($dialogOuter.width()).height($dialogOuter.height());
        });
    }

    $.fn.dialog2IFrame.defaults = {
        additionalClass: "",
        // Appends &iframe=true to URL opened on IFrame
        appendParamUrl: false,
        // Reloads main page when modal is closed
        reloadOnClose: false,
        closeOnOverlayClick: false,
        closeOnEscape: false,
        showCloseHandle: false,
        close: function () {
            return true;
        }
    };
})(jQuery);