/*
 * Ajax controls plugin for jquery.
 * 
 * Licensed under the MIT license 
 * http://www.opensource.org/licenses/mit-license.php 
 * 
 * Has to be invoked once on page load like
 * 
 *    $(function() {
 *        $(document).controls();
 *    });
 * 
 * to apply all handlers registered to $.fn.controls.bindings.
 * 
 * @version: 0.9 (29/10/2010)
 * @requires jQuery v1.4 or later
 * 
 * @author nico.rehwaldt (nire-nokin@gmail.com)
 */
(function($) {
    $.extend($.fn, {
        controls: function(options) {
            var element = this;
            
            $.each($.fn.controls.bindings, function(selector, action) {
                element
                    .find(selector)
                    .each(action)
                    .end();
            });

            return this;
        }
    });

    /**
     * Space for other jquery plugins to register javascript controls
     */
    $.fn.controls.bindings = {
        /**
         * Register specific handler for ajax annotations here, e.g.
         * 
         * "a.ajax": function() {
         *     // load ajax page or alert("FOO, ajax link clicked");
         * }
         */
    };
})(jQuery);