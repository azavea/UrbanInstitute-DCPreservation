(function(P) {
    P.Widget.PanelCloser = function(options) {
        var _self = {},
            _options = $.extend({
                bindTo: P
            }, options);

        
        // When the user finishes a click, check to see if the target (or parent chain) had
        //  a .pdp-closable-panel class.  If it does, the element with that class will close
        _self.init = Azavea.tryCatch('init app', function() {

            $(document).bind('mouseup', function(event){
                // An absurdly long list of classes that do not cause the panel closer to close
                if ($(event.target).closest('.pdp-closable-panel').length <= 0) {
                    if ($(event.target).closest('.pdp-closable-panel-button').length <= 0) {
                        if ($(event.target).closest('.ui-dialog').length <= 0) {
                            if ($(event.target).closest('.ui-autocomplete').length <= 0){
                                if ($(event.target).closest('.pdp-pdb-control-tooltip').length <= 0){
                                    // Hide any closable panels
                                    $('.pdp-closable-panel').hide();
                                    
                                    // Tell anyone that we did
                                    $(_options.bindTo).trigger('pdp-panel-close-event');
                                }
                            }
                        }
                    }
                }
            });
            return _self;
        });
        
        return _self;
    };
}(PDP));