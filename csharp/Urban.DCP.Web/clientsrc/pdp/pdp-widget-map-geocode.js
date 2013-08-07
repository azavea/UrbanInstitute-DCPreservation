(function(P) {
    P.Widget.Map.Geocode = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'maplayer',
                bindTo: P
            }, options),
            _$button,
            _$geocodeInput,
            _$submitButton,
            _$geocodeFailure,
            _$resultsContainer,
            _$resultsList,
            _$panel,
            _nycBounds, 
            _geocoder;

       // When a new base layer is selected, trigger an event to tell the map                               
        var _zoomTo = Azavea.tryCatch('successful geocode', function(resultGeom) {
            $(_options.bindTo).trigger('pdp-map-zoom-to',
                [resultGeom.viewport.getSouthWest().lng(), resultGeom.viewport.getSouthWest().lat(), 
                 resultGeom.viewport.getNorthEast().lng(), resultGeom.viewport.getNorthEast().lat(),
                 resultGeom.location.lng(), resultGeom.location.lat()]);
            _togglePanel();
        });

        // Stops events from going to the map.                             
        var _stopPropagation = Azavea.tryCatch('panel mousedown', function(event) {            
            // We don't want click events passing through to the map layer underneath
            event.stopPropagation();
        });
        
        // Show or hide the panel                              
        var _togglePanel = Azavea.tryCatch('toggle map layer panel', function(event) {            
            // Change panel state.  It might seem like you should hide the closable-panel once, 
            //  outside of the if, but then you could never hide the map layer panel.  Do it seperately.
            if (_$panel.is(':visible')){
                // Hide any panels
                $('.pdp-closable-panel').hide();
                
            }else{
                
                // Also clear the failure messages and the value in the text box, since they're
                // left over from last time.
                _$geocodeInput.val('');
                _$geocodeFailure.hide();
                _$resultsContainer.hide();
                
                $('.pdp-closable-panel').hide();
                _$panel.show();
                
                // When the panel becomes visible, focus should jump to the text box.  This has to be
                //  after the show()
                _$geocodeInput.focus();
            }

        });
        

        
        var _geocode = Azavea.tryCatch('geocode an input', function() {
            // Do all this google stuff in a try block so we can still run the app if google is down
            try{
                // This is a bounding box (in lat/lon) that will "bias" the results toward NYC.
                if(!_nycBounds){
                    _nycBounds = new google.maps.LatLngBounds(new google.maps.LatLng(40.496, -74.257),new google.maps.LatLng(40.916, -73.699));
                }
                if (!_geocoder){
                    _geocoder = new google.maps.Geocoder();
                }
            
                var text = _$geocodeInput.val();
                if (text === 'asteroids') {
                    // Whee!
                    var s = document.createElement('script');
                    s.type='text/javascript';
                    document.body.appendChild(s);
                    s.src='http://erkie.github.com/asteroids.min.js';
                    _$geocodeInput.val('Thanks to Erik Rothoff Andersson!');
                } else {
                    // When we attempt a geocode, we start by clearing all the old results, errors, etc.
                    _$resultsContainer.hide();
                    _$geocodeFailure.hide();
                    if (text) {
                        var geocodeParams = {
                                address: text,
                                bounds: _nycBounds
                            };
                        _geocoder.geocode(geocodeParams, _processGeocodeResults);
                    }
                }
            }
            catch(err){
                // Tell the user we cannot geocode at the moment
                P.Util.quickAlert('Go To Location is temporarily unavailable.');
            }
            
        });
        
        var _processGeocodeResults = Azavea.tryCatch('process geocode results', function(results, status) {
            // Check that we got a good result or results back.
            if ((status === google.maps.GeocoderStatus.OK) && results && (results.length > 0)) {
                if (results.length === 1) {
                    // When there's only one, we want to zoom straight there.
                    _zoomTo(results[0].geometry);
                } else {
                    // Give the user a list of results to choose from.
                    _$resultsList.empty();
                    $.each(results, function (i, result) {
                        $('<li><a href="javascript:void(0);">' + result.formatted_address + '</a></li>').appendTo(_$resultsList).click(function() {
                            _zoomTo(result.geometry);
                        });
                    });
                    _$resultsContainer.show();
                }
                _$geocodeInput.val('');
            } else {
                _$geocodeFailure.show();
            }
        });


        // Bind to events that this widget cares about                                
        var _bindEvents = Azavea.tryCatch('bind map layer events', function() {
            _$button.click(_togglePanel);
            _$button.mousedown(_stopPropagation)
                    .dblclick(_stopPropagation);
            _$panel.mousedown(_stopPropagation)
                    .dblclick(_stopPropagation);
            _$submitButton.click(_geocode);
            // Enable form submission by hitting "enter" (keycode = 13) in form
            _$geocodeInput.keyup(function(event){
                if (event.which === 13){
                    _$submitButton.click();
                }
            });
        }); 
        
        // Render the basic markup that this widget uses   
        var _render = Azavea.tryCatch('render map geocode widget', function() {
            // We need a button and a panel, which holds elements
            $('<button id="pdp-map-geocode" class="pdp-closable-panel-button pdp-shadow-drop">Go To</button>' + 
                '<div id="pdp-map-geocode-panel" class="pdp-closable-panel pdp-shadow-drop">' + 
                    '<div id="pdp-map-geocode-panel-search" class="pdp-map-geocode-section">' +
                        '<label for="pdp-map-geocode-input">Address / Intersection / Place Name</label>' +
                        '<input id="pdp-map-geocode-input" type="text"/>' +
                        '<button id="pdp-map-geocode-submit" class="pdp-button">Go</button>' +
                    '</div>' +
                    '<div id="pdp-map-geocode-failure" class="ui-state-error ui-corner-all">Unable to find that location.</div>' +
                    '<div id="pdp-map-geocode-results-container" class="pdp-map-geocode-section">' + 
                        '<div id="pdp-map-geocode-results-header">Did you mean:</div>' +
                        '<ul id="pdp-map-geocode-results-content"/>' + 
                    '</div>' +
                '</div>').appendTo(_options.target);
                
            // Set default state and get vars for common selectors
            _$geocodeInput = $('#pdp-map-geocode-input');
            _$geocodeFailure = $('#pdp-map-geocode-failure');
            _$submitButton = $('#pdp-map-geocode-submit').button();
            _$resultsContainer = $('#pdp-map-geocode-results-container');
            _$resultsList = $('#pdp-map-geocode-results-content');
            _$button = $('#pdp-map-geocode').button();
            _$panel = $('#pdp-map-geocode-panel').hide();
        });
        
        // Initiate the widget    
        _self.init = Azavea.tryCatch('init map geocoder widget', function() {
            
            // Render controls
            _render();

            // Bind events to our elements
            _bindEvents();
                        
            return _self;
        });
        return _self;
    };
}(PDP));
