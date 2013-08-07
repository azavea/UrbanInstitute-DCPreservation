(function(P) {
    P.Widget.Map.Layers = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'maplayer',
                bindTo: P
            }, options),
            _curResponse,
            _$button,
            _$panel,
            _$layerButtons,
            $timeSlider, 
            $timeLabel,
            _availableTimes,
            _mostRecentTimeIndex,
            _$nychanisContainer;


        // Grab the last (most recent) time that exists which is also not null
        var _setMostRecentAvailableTime = Azavea.tryCatch('get most recent available time', function(){
            
            // Loop through the available times from most recent down, and find the first non-null;
            var i;
            for(i=_availableTimes.length-1; i >-1; i--){
                if (_availableTimes[i]){
                    _mostRecentTimeIndex = i;
                    break;
                }
            }
        });

        // Event for when the slider value changes, not while it is being dragged
        var _sliderChanged = Azavea.tryCatch('slider changed', function(index){           
            // Indicate to the map that a new nychanis layer has been selected
            $(P.Nychanis).trigger('pdp-nychanis-layer-change', [_curResponse, index, _availableTimes[index]]);
        });
        
        // Event for when the slider is being dragged
        var _sliderMoved = Azavea.tryCatch('slider moved', function(val){
            // Update the display, the change event handles actual requests when 
            //  the slider value is updated
            $timeLabel.text('Displaying results from: ' + _availableTimes[val]);
        });
        
       // When a new base layer is selected, trigger an event to tell the map                               
        var _layerChange = Azavea.tryCatch('layer change click', function(event) {
            var name = $('input[name="pdp-map-layers-buttons"]:checked').val();           
            $(_options.bindTo).trigger('pdp-map-base-layer-changed', [name]);
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
                $('.pdp-closable-panel').hide();
                _$panel.show();
            }
            
        });

        // Render the legend after a data response                             
        var _renderLegend = Azavea.tryCatch('render legend', function() {            
            var legend = '<div id="pdp-nychanis-map-legend">';
            
            // Loop through each legend item
            $.each(_curResponse.LegendInfo.Elements, function(i, item){
                var colorStr = item.Color;
                var colorR = parseInt(colorStr.substring(1,3), 16);
                var colorG = parseInt(colorStr.substring(3,5), 16);
                var colorB = parseInt(colorStr.substring(5), 16);
                var opacity = _curResponse.LegendInfo.Opacity;
                if (!opacity) {
                    opacity = '1.0';
                }
                var minToShow = item.MinValue;
                var maxToShow = item.MaxValue;
                if (_curResponse.LegendInfo.ValueType) {
                    var renderFunc = P.Util.renderers[_curResponse.LegendInfo.ValueType];
                    if (renderFunc) {
                        minToShow = renderFunc(minToShow);
                        maxToShow = renderFunc(maxToShow);
                    } else {
                        maxToShow += ' (unable to render type ' + _curResponse.LegendInfo.ValueType + ')';
                    }
                }
                var backgroundColorCss = 
                        // Start by declaring background with rgb, which works in older browsers and IE.
                        // Also note that for IE 6 and 7 you can't use "background-color", it has to be
                        // "background".
                        'background: rgb(' + colorR + ',' + colorG + ',' + colorB + ');' +
                        'background: rgba(' + colorR + ',' + colorG + ',' + colorB + ',' + opacity + ');';
                legend += '<div class="pdp-nychanis-legend-row"><span class="pdp-nychanis-legend-swatch" style="' + backgroundColorCss +
                        '"/><span class="pdp-nychanis-legend-info pdp-nychanis-legend-info-min">' +
                        minToShow + '</span><span class="pdp-nychanis-legend-info pdp-nychanis-legend-info-sep">-</span><span class="pdp-nychanis-legend-info pdp-nychanis-legend-info-max">' + maxToShow + '</span></div>';
            });
            
            legend += '<div>';
            
            // Append it to the target
            $('#pdp-nychanis-legend-container')
                .empty()
                .append(legend);
        });
        
        // Setup the fancy Nychanis layer picker
        var _renderNychanisSlider = Azavea.tryCatch('render legend', function() {
            $timeLabel.text('Displaying results from: ' + _availableTimes[_mostRecentTimeIndex]);        
            $timeSlider.slider('option', {max: _mostRecentTimeIndex, min: 0, value: _mostRecentTimeIndex, disabled: false});
            
            P.Util.renderers.sliderTicks($timeSlider, _availableTimes);
            
            _$nychanisContainer.show();
        });
        
        // When we recieve a nychanis data response
        var _handleNychanisResponse = Azavea.tryCatch('handle nychanis data', function(event, data){
            // Cache response
            _curResponse = data;
            
            // If we got any layers, allow the user to toggle between them
            if (data.MapInfo && data.MapInfo.Layers && data.MapInfo.Layers.length) {
                _availableTimes = [];
                _mostRecentTimeIndex = null;
                var i;
                
                // Always show the Nychanis layer when a new search is done
                $('#pdp-map-layers-show-nyc').attr('checked', true);
                $('#pdp-nyc-map-title').show();
                $(P.Nychanis).trigger('pdp-nyc-layer-toggle', true);
                
                // Create a list of availabe time frames
                for(i=0; i <_curResponse.MapInfo.Layers.length;  i++) {
                    if (_curResponse.MapInfo.Layers[i].Config) {
                        _availableTimes.push(_curResponse.MapInfo.Layers[i].Name);
                    } else {
                        _availableTimes.push(null);
                    }
                }
                // In our collection, the most recent time index is the last one.
                //_mostRecentTimeIndex = _availableTimes.length - 1;
                _setMostRecentAvailableTime();
                
                // Enable and set the controls to the correct data state
                _renderLegend();
                _renderNychanisSlider();
                
                // Trigger the layer change to the default layer
                $(P.Nychanis).trigger('pdp-nychanis-layer-change', [_curResponse, _mostRecentTimeIndex, _availableTimes[_mostRecentTimeIndex]]);
            } else {
                // No layers, force the map to remove the previous
                _$nychanisContainer.hide();
                $(P.Nychanis).trigger('pdp-nychanis-layer-change', [_curResponse, -1, '']);
            }
        });
        
        // Bind to events that this widget cares about                                
        var _bindEvents = Azavea.tryCatch('bind map layer events', function() {
            _$button.click(_togglePanel);
            _$button.mousedown(_stopPropagation)
                    .dblclick(_stopPropagation);
            _$panel.mousedown(_stopPropagation)
                    .dblclick(_stopPropagation);
            _$layerButtons.change(_layerChange);
            
            $('#pdp-map-layers-show-pdb').click(function() {
                
                // Show/hide the map title if we are show/hiding the layer
                if (this.checked){
                    $('#pdp-pdb-map-title').show();
                }else{
                    $('#pdp-pdb-map-title').hide();
                }
                
                $(P.Pdb).trigger('pdp-pdb-layer-toggle', [ this.checked ]);
            });

            $('#pdp-map-layers-show-nyc').click(function() {
                // Show/hide the map title if we are show/hiding the layer
                if (this.checked){
                    $('#pdp-nychanis-map-title').show();
                }else{
                    $('#pdp-nychanis-map-title').hide();
                }            
                $(P.Nychanis).trigger('pdp-nyc-layer-toggle', [ this.checked ]);
            });
                        
            // We will display nychanis controls when we have data
            $(P.Nychanis).bind('pdp-data-response', _handleNychanisResponse);
            $(P.Pdb).bind('pdp-data-response', function() {
                // Always show the Pdb layer when a new search is done
                $('#pdp-map-layers-show-pdb').attr('checked', true);
                $('#pdp-pdb-map-title').show();
                $(P.Pdb).trigger('pdp-pdb-layer-toggle', true);
            });
                         
            // We will display nychanis controls when we have data
            $(P.Nychanis).bind('pdp-criteria-reset', function(){
                if (_$nychanisContainer){
                    _$nychanisContainer.hide();
                }
            });
        }); 
        
        var _addStaticLayers = Azavea.tryCatch('append static layers to map layer widget', function() {
            var $container = $('#pdp-map-layers-outlines');
            $('<label for="pdp-map-layers-outlines-select" class="pdp-map-layers-label">Municipal Boundaries</label>').appendTo($container);
            var $select = $('<select id="pdp-map-layers-outlines-select"/>').appendTo($container);
            // Now we have an empty select.  First add the "none" option:
            $('<option value="none">-- None --</option>').appendTo($select);
            // Now add the actual map options.
            $.each(P.Config.Outlines.Layers, function(name, layer) {
                $('<option value="' + name + '">' + layer.Name + '</option>').appendTo($select);
            });
            
            // Now add the event handling.
            $select.change(function() {
                $(_options.bindTo).trigger('pdp-map-outline-layer-changed', $select.val());
            });
        });       
        
        // Render the basic markup that this widget uses   
        var _render = Azavea.tryCatch('render map layer widget', function() {
            // We need a button and a panel, which holds elements
            $('<button id="pdp-map-layers" class="pdp-closable-panel-button pdp-shadow-drop">Legend</button>' + 
                '<div id="pdp-map-layers-panel" class="pdp-closable-panel pdp-shadow-drop">' + 
                    '<div id="pdp-map-layers-panel-buttonset" class="pdp-map-layers-section">' +
                        '<input id="pdp-map-layers-street" name="pdp-map-layers-buttons" class="pdp-map-layer-button" value="Street" type="radio" checked="checked"/>' +
                        '<label for="pdp-map-layers-street">Street</label>' +
                        '<input id="pdp-map-layers-hybrid" name="pdp-map-layers-buttons" class="pdp-map-layer-button" value="Hybrid" type="radio"/>' +
                        '<label for="pdp-map-layers-hybrid">Hybrid</label>' +
                        '<input id="pdp-map-layers-sat" name="pdp-map-layers-buttons" class="pdp-map-layer-button" value="Satellite" type="radio"/>' +
                        '<label for="pdp-map-layers-sat">Satellite</label>' +
                        '<input id="pdp-map-layers-terrain" name="pdp-map-layers-buttons" class="pdp-map-layer-button" value="Terrain" type="radio"/>' +
                        '<label for="pdp-map-layers-terrain">Terrain</label>' +
                    '</div>' +
                    '<div id="pdp-map-layers-outlines" class="pdp-map-layers-section"/>' +
                    '<div  class="pdp-map-layers-section"><input id="pdp-map-layers-show-pdb" type="checkbox" checked="checked" class="pdp-input"/>' +
                        '<span id="pdp-pdb-map-layers-help" class="pdp-map-marker-aggregated-label" title="Property results are shown in groupings when many properties are near one another.  The number indicates how many properties are represented.">?</span><label for="pdp-map-layers-show-pdb" class="pdp-map-layers-label">Housing (SHIP) Results</label></div>' +
                    '<div id="pdp-nychanis-results-container" class="pdp-map-layers-section">' + 
                        '<div class="pdp-map-layers-header"><input id="pdp-map-layers-show-nyc" type="checkbox" checked="checked" class="pdp-input"/>' +
                            '<label for="pdp-map-layers-show-nyc" class="pdp-map-layers-label">Neighborhood Info Results</label>' + 
                        '</div>' +
                        '<div class="pdp-map-layers-content"><label id="pdp-map-layers-year-value"></label>' + 
                            '<div id="pdp-map-layers-year-slider"></div>' + 
                            '<label class="pdp-map-layers-header">Legend</label>' +
                            '<div id="pdp-nychanis-legend-container"></div>' +
                        '</div>' +
                     '</div>' +
                '</div>').appendTo(_options.target);
              
            $('#pdp-pdb-map-layers-help').tooltip({
                tipClass: 'pdp-pdb-control-tooltip-left pdp-map-layers-tooltip',
                
	            // place tooltip on the right edge
	            position: 'center left',

	            // use the built-in fadeIn/fadeOut effect
	            effect: "fade"
            });
                
            // Set default state and get vars for common selectors
            _$button = $('#pdp-map-layers').button();
            _$panel = $('#pdp-map-layers-panel').hide();
            _$layerButtons = $('#pdp-map-layers-panel-buttonset').buttonset(); 
            $timeLabel = $('#pdp-map-layers-year-value');   
            _$nychanisContainer = $('#pdp-nychanis-results-container');                    
            $timeSlider = $('#pdp-map-layers-year-slider').slider({
                range: false,
                disabled: true,
                min: 1975,
                max: 2010,
                value: 2000,
                slide: function(event, ui) {
			        if (_availableTimes[ui.value]) {
			            _sliderMoved(ui.value);
			        } else {
			        return false;
                    }
                },
                change: function(event, ui){
                    _sliderChanged(ui.value);
                }
            });
            
            _addStaticLayers();
        });
        
        // Initiate the widget    
        _self.init = Azavea.tryCatch('init map layer selector widget', function() {
            
            // Render controls
            _render();

            // Bind events to our elements
            _bindEvents();
                        
            return _self;
        });
        return _self;
    };
}(PDP));
