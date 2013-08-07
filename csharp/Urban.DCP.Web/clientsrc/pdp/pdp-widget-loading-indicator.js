(function(P) {
    P.Widget.LoadingIndicator = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: [P, P.Nychanis,P.Pdb],
                delay: 500
            }, options),
            _$indicator,
            _$overlay,
            _timer;

        var _showIndicator = Azavea.tryCatch('show loader indicator', function(){
            var w, h;
            w = $(window).width() /2;
            h = $(window).height() /2;

            // Place it roughly center
            _$indicator.css('top', h - _$indicator.height() / 2);
            _$indicator.css('left', w - _$indicator.width() / 2);
            
            // Wait a bit before displaying, in case the call is actually really fast
            _timer = setTimeout(function(){
                // Using jquery for opacity so we don't need transparent png, and IE inconsistancies.
                _$overlay.fadeTo('fast', 0.5);
                _$indicator.show();
            }, _options.delay);
        });
        
        // Hide the overlay and indicator        
        var _hideIndicator = Azavea.tryCatch('hide loader indicator', function(){
            // Clear the timeout, in case the call was fast enough to not warrant a display
            clearTimeout(_timer);
            _$overlay.fadeTo('fast', 0.0, function(){
                _$overlay.hide();
            });
            
            _$indicator.hide();
        });
        
        // Bind to events that this widget cares about
        var _bindEvents = Azavea.tryCatch('bind indicator events', function(){
            // We will bind to many things
            $.each(_options.bindTo, function(i, obj){
                $(obj).bind('pdp-data-request', _showIndicator);
                $(obj).bind('pdp-loading-indicator-request', _showIndicator);
                //$(obj).bind('pdp-data-response', _hideIndicator);
                $(obj).bind('pdp-loading-finished', _hideIndicator);
             });
        });
        
        // Render the indicator and overlay to the screen, hidden
        var _render = Azavea.tryCatch('render loader indicator', function(){
            _$overlay = $('<div id="pdp-loading-overlay"></div>');
            _$indicator = $('<div id="pdp-loading-indicator" class="ui-corner-all"></div>');
            _$overlay
                .hide()
                .appendTo(_options.target);
            _$indicator
                .hide()
                .appendTo(_options.target);
        });
                
        // Initialize the loader widget            
        _self.init = Azavea.tryCatch('init app', function() {  
            _render();
            _bindEvents();

            _$indicator = $('#pdp-loading-indicator');                     
            return _self;
        });
        
        return _self;
    };
}(PDP));