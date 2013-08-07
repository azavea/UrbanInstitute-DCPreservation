(function(P) {
    P.Widget.Splash = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                cookieName: 'pdp-ignore-splash',
                expireYear: 2020,
                backgroundOpacity: 0.3
            }, options),
            _$splash,
            _$screen;
        
        var _updateLayoutHeight = Azavea.tryCatch('update layout height', function() {
            
            var w, h;
            var $window = $(window);
            
            w = $window.width() /2;
            h = $window.height() /2;
            
            _$screen.css('height', $window.height() - 50);
            
            var top = h - _$screen.height() / 2;
            
            // Place it roughly center
            _$screen.css('top', top < 5 ? 5 : top);
            _$screen.css('left', w - _$screen.width() / 2);
            
        });
                
        //<summary>
        // Sets a cookie to never expire and not to show the splash
        //</summary>
        var _setCookie = Azavea.tryCatch('set splash cookie', function(){
            var expires = new Date();
            // Calculate a day to expire
            expires.setFullYear(_options.expireYear, 1, 1);
                
            // Create the cookie    
            document.cookie = _options.cookieName + '=true;expires=' + expires.toUTCString(); 
        });

        //<summary>
        // Deletes the cookie to suppress splash screen
        //</summary>
        var _deleteCookie = Azavea.tryCatch('set splash cookie', function(){
            var expires = new Date();
            
            // Calculate a day to expire on year in the past
            expires.setFullYear(expires.getFullYear - 1, 1,1);                       
            
            // Set the cookie
            document.cookie = _options.cookieName + '=false;expires=' + expires.toUTCString(); 
        });
        
        //<summary>
        // Render the markup to the screen.  This is an overlay div for the screen with a second
        //  div for displaying our message.  Includes a do not show again checkbox.
        //</summary>
        var _render = Azavea.tryCatch('render splash', function(){
            $('<div id="pdp-splash-overlay"></div>' + 
            '<div id="pdp-splash-screen" class="ui-corner-all pdp-shadow-dark-all">' + 
                '<h2>Welcome to the Furman Center\'s Data Search Tool</h2>' + 
                '<div id="pdp-splash-screen-content">' +
                    '<div id="pdp-splash-search-descriptions">' +   
                        '<div><span><strong>Neighborhood Info:</strong> View or download tables and maps of historic and contemporary housing, demographic, and community information at a variety of neighborhood sizes in New York City.</span></div>' +
                        '<div><span><strong>Affordable Housing (SHIP):</strong> View or download tables and  maps of thousands of New York City properties in the Furman Center\'s SHIP (Subsidized Housing Information Project) database.</span></div>' +
                    '</div>' +
                    '<table id="pdp-splash-table">' + 
                        '<tr class="pdp-splash-image-row">' + 
                            '<td><img width="190px" height="240px" src="client/css/images/splash/splash-nychanis.png"></td>' + 
                            '<td><img width="190px" height="240px" src="client/css/images/splash/splash-property.png"></td>' +
                        '<tr class="pdp-splash-link-row">' + 
                            '<td><a id="pdp-splash-nychanis" class="pdp-splash-link" href="javascript:void(0);">Neighborhood Search</a></td>' + 
                            '<td><a id="pdp-splash-property" class="pdp-splash-link" href="javascript:void(0);">Housing (SHIP) Search</a></td>' + 
                    '</table>' +
                    '<div id="pdp-splash-search-instructions">' +   
                        '<div>You may switch between Neighborhood Info and Housing (SHIP) using their tabs, and display both on the same map.  Choices made beneath one tab do not modify the other\'s results.</div>' +
                    '</div>' +                    
                '</div>' + 
                '<div id="pdp-splash-buttonbar">' + 
                    '<div id="pdp-splash-linkbar">' +
                        '<a href="http://www.furmancenter.org/data/">Furman Center Data</a>' +
                        '<a href="http://www.furmancenter.org/data/search/guide/">How-to Guide</a>' + 
                        '<a href="http://www.furmancenter.org/data/disclaimer/">Disclaimer</a>' + 
                    '</div>' + 
                    '<a id="pdp-splash-skip" href="javascript:void(0);">Skip</a>' +
                    '<input id="pdp-splash-no-show" type="checkbox" class="pdp-input pdp-input-checkbox left"/>' + 
                    '<label for="pdp-splash-no-show" class="left">Do not show again</label>' +                
                '</div>' + 
                '<div id="pdp-splash-support">This site supports Firefox 3+, Internet Explorer 7+ and Chrome 4+.</div>' + 
            '</div>').appendTo(_options.target);
        });

        //<summary>
        // Display the splash screen and overlay, make it pretty
        //</summary>
        var _display = Azavea.tryCatch('display splash screen', function(){           
            
            _updateLayoutHeight();
            $(window).resize(function() {
                _updateLayoutHeight();
            });
            _$splash.fadeTo('fast', _options.backgroundOpacity);
        });
        
        //<summary>
        // Hide the splash screen and overlay
        //</summary>
        var _hide = Azavea.tryCatch('hide splash screen', function(){
            _$splash.fadeOut();
            _$screen.fadeOut();            
        });        
        
        //<summary>
        // Bind to events that this widget cares about.
        //</summary>
        var _bindEvents = Azavea.tryCatch('bind to events splash', function(){
            var $doNotShow = $('#pdp-splash-no-show'),
                $skip = $('#pdp-splash-skip');
            
            _$splash = $('#pdp-splash-overlay');                
            _$screen = $('#pdp-splash-screen');    
            
            // Handle nychanis link click
            $('#pdp-splash-nychanis', _$screen).click(function(){
                // Activate the nychanis tab
                $('a[href="#pdp-nychanis-view"]').click();
                _hide();
            });
            
            // Handle property link click
            $('#pdp-splash-property', _$screen).click(function(){
                // Activate the property tab
                $('a[href="#pdp-pdb-view"]').click();
                _hide();
            });       
            
            // Handle property counts link click
            $('#pdp-splash-counts', _$screen).click(function(){
                // Activate the propery counts tab
                $('#pdp-pdb-search-result-counts').change();
                
                // Show the popup
                $(P.Pdb).trigger('pdp-show-counts-panel');
                
                _hide();
            });    
                             
            // Handle the "Do not show" checkbox
            $($doNotShow, _$splash).change(function(event){
                if ($doNotShow.is(':checked')){
                    // Set a cookie to not show again
                    _setCookie();
                }else{
                    // Delete the cookie so splash is shown again
                    _deleteCookie();   
                }
            });
            
            // Handle the ok button
            $($skip, _$splash).click(function(event){
                _hide();
            });            
            
            // Hide on escape (keycode: 27)
            _$splash.keydown(function(event){
                if (event.keyCode === 27){
                    _hide();
                }
            });            
        });
        
        //<summary>
        // Check the value of the no-show cookie to determine if we show the screen
        //</summary>
        var _doShow = Azavea.tryCatch('bind to events splash', function(){
            var index = -1,
                start = 0, 
                end = 0,
                val = '';
            
            if (document.cookie.length > 0){
                // Check if the splash cookie exists
                index = document.cookie.indexOf(_options.cookieName + "=");
                
                if (index !== -1){
                    // Read the cookie string to the end of the first semicolon
                    start = index + _options.cookieName.length + 1;
                    end = document.cookie.indexOf(";", start);
                    
                    if (end === -1){
                        end = document.cookie.length;
                    }
                    
                    // If we have suppressed splash, return false - it is not shown
                    val = unescape(document.cookie.substring(start, end));
                    if (val === 'true'){
                        return false;
                    } else{
                        return true;
                    }
                }
            }
            return true;            
        });
                                
        //<summary>
        // Initializes the splash screen
        //</summary>
        _self.init = Azavea.tryCatch('init splash', function() {
            if (_doShow()){
                // Create and display our splash form
                _render();
                _bindEvents();
                _display();
            }
            return _self;
        });
        
        return _self;
    };
}(PDP));