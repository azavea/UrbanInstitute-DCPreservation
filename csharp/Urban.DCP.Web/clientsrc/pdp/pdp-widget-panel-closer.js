(function(P) {
    P.Widget.PanelCloser = function(options) {
        var _self = {},
            _options = $.extend({
                bindTo: P
            }, options);

        
        // When the user finishes a click, check to see if the target (or parent chain) had
        //  a .pdp-closable-panel class.  If it does, the element with that class will close
        _self.init = Azavea.tryCatch('init app', function() {
            var exempt = ['.pdp-closable-panel', '.pdp-closable-panel-button', '.ui-dialog', '.ui-autocomplete',
                '.ui-datepicker', '.pdp-pdb-control-tooltip'];
            
            $(document).bind('mouseup', function (event) {
                var $target = $(event.target);
                // An absurdly long list of classes that do not cause the panel closer to close
                if (_.all(exempt, function (className) { return $target.closest(className).length <= 0; })) {
                                    
                    // Hide any closable panels
                    $('.pdp-closable-panel').hide();

                    // Tell anyone that we did
                    $(_options.bindTo).trigger('pdp-panel-close-event');
                }
                 
            });
            return _self;
        });
        
        return _self;
    };
}(PDP));