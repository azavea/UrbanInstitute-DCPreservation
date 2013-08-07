(function(P) {
    P.Widget.Export = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                defaultText: 'Export To CSV'
            }, options),
            _manager = {},
            _curCriteria = {};
                    
        _self.init = Azavea.tryCatch('init app', function() {
            var $link = {}, $container;
            
            // Render myself to the page
            $container = $(_options.target).append('<div class="pdp-export-link"><img class="pdp-export-image" src="client/css/images/export-icon.png"/><a id="pdp-export" href="javascript:void(0)">' + _options.defaultText + '</a>').hide(); 
            
            $link = $('#pdp-export', _options.target);
            
            // Bind to click
            $link.click(function(){
                // Request the export - this will open a new window, so there's not 
                // much need to do any visual indicators that something is happening.
                // The new window should show a busy indicator, etc.
                $(_options.bindTo).trigger('pdp-export-request');
            });
           
            // Bind to results ready event, and show thyself
            $(_options.bindTo).bind('pdp-data-response', function(){
                $container.show();
            });
            
            $(_options.bindTo).bind('pdp-criteria-reset', function() {
                $container.hide();
            });
           
            return _self;
        });
        
        return _self;
    };
}(PDP));