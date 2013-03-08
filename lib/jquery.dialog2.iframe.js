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
            var dialogOuter = $('#' + idDialogOuter);
            var dialogFrame = dialogOuter.find('iframe');

            //Append &iframe=true to url
            var newURL = this.protocol + "//" +
                    UrlLastSlash(this.host) +
                    RemoveStartingSlash(this.pathname) +
                    $.query.load(this.href).set("iframe", "true").copy();

            dialogFrame.attr('src', newURL);
            //dialogFrame.attr('src', this.href); //former URL

            var h = options.height;
            dialogFrame.css('height', h);

            dialogOuter.css('overflow', 'hidden');
            dialogOuter.css('padding', '0 10px');
            dialogOuter.css('margin', '0');

            var dialog = dialogOuter.dialog2(
                {
                    title: $(btn).attr('data-original-title') ? $(btn).attr('data-original-title') : '',
                    buttons: {
                        Close: {
                            click: function () {
                                options.close();
                                $(this).dialog2('close');
                                if ($(btn).hasClass('reload-on-close')) {
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
                .find('iframe').width($('.modal').width() - 20) // Sets the iFrame width to the same as the modal;
        });
    }

    $.fn.dialog2IFrame.defaults = {
        height: 300,
        close: function () {
            return true;
        }
    };
})(jQuery);