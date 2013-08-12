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
            _$layerButtons;

  
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
            
            $(P.Pdb).bind('pdp-data-response', function() {
                // Always show the Pdb layer when a new search is done
                $('#pdp-map-layers-show-pdb').attr('checked', true);
                $('#pdp-pdb-map-title').show();
                $(P.Pdb).trigger('pdp-pdb-layer-toggle', true);
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
