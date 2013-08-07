(function(P) {
    P.Widget.Map = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'map',
                bindTo: P,
                layers: [
                    new OpenLayers.Layer.Google("Street", {numZoomLevels: 20}),
                    new OpenLayers.Layer.Google("Satellite", {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}),
                    new OpenLayers.Layer.Google("Hybrid", {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20}),
                    new OpenLayers.Layer.Google("Terrain", {type: google.maps.MapTypeId.TERRAIN})                
                ],
                defaultBbox: new OpenLayers.Bounds(-8266466, 4936833, -8204248, 5000206),
                maxBbox: new OpenLayers.Bounds(-8306466, 4896833, -8164248, 5040206)
            }, options),
            $target,
            _map,
            _$flashPointElement,
            _pointToFlash,
            _nychanisLayer,
            _pdbLayer,
            _outlineLayer,
            _popup,
            // Used for reprojection from lat/lon.
            _proj = new OpenLayers.Projection("EPSG:4326"),
            _popupPropertyId = -1,
            _trackPopup = false,
            _popupPropertyIdByIndex,
            _popupIndexByPropertyId;
        
        // The base layer has changed, update map.
        var _handleBaseLayerChange = Azavea.tryCatch('base layer changed', function(event, name){
             var layers = _map.getLayersByName(name);
             if (layers.length) {  
                _map.setBaseLayer(layers[0]);
                P.Util.trackMetric('Map', 'Base Layer Change', name);
             } else {
                P.Util.quickError('Could not switch to base layer: [' + name + '], does not exist in map.');
             }
        });
        
        // Add a nychanis layer to the map, using the index from the current reponse
        var _updateNychanisLayer = Azavea.tryCatch('add nychanis layer', function(data, layerIndex){
            
            // Make sure we have layer at this position
            if (data.MapInfo && data.MapInfo.Layers && data.MapInfo.Layers.length && data.MapInfo.Layers.length > layerIndex) {
                if (_nychanisLayer) {
                    // Merge the new layer params into the nychanis layer currently displayed on the map
                    _nychanisLayer.mergeNewParams(data.MapInfo.Layers[layerIndex].Config);
                } else {
                    //Init the nychanis layer with the params from the data response
                    _nychanisLayer = new OpenLayers.Layer.WMS(
                        'nychanis', data.MapInfo.Server,
                        data.MapInfo.Layers[layerIndex].Config,
                            {
                                isBaseLayer: false,
                                tileSize: new OpenLayers.Size(500,500),
                                buffer: 0,
                                displayOutsideMaxExtent: true
                            } 
                        );
                    _map.addLayer(_nychanisLayer);
                    // This is a bit hacky.  We need to make sure the pdb marker layer is on top
                    // of the nychanis layer, but the nychanis layer is being added dynamicly and
                    // the pdb layer is not.  So for now when we add the nychanis layer, make sure
                    // the pdb layer is pushed to the top.
                    if (_pdbLayer) {
                        _map.raiseLayer(_pdbLayer, 50);
                    }
                }
            } else {
                // Can't add requested layer, remove the previously added one so the title/display matches
                if (_nychanisLayer){
                    _map.removeLayer(_nychanisLayer);
                    _nychanisLayer = null;
                } 
            }
        });
              
        // The base layer has changed, update map using the index of the response layer
        var _handleNychanisLayerChange = Azavea.tryCatch('nychanis layer changed', function(event, nychanisData, layerIndex){
            _updateNychanisLayer(nychanisData, layerIndex);            
        });
        
        // Add a nychanis layer to the map, using the index from the current reponse
        var _updateOutlineLayer = Azavea.tryCatch('change outline layer', function(layerIndex){
            // See if there is such a layer config.
            var layerConfig = P.Config.Outlines.Layers[layerIndex];
            if (layerConfig) {
                // Reconfigure the layer and make sure it's visible.
                _outlineLayer.mergeNewParams(layerConfig.Config);
                if (!_outlineLayer.getVisibility()) {
                    _outlineLayer.setVisibility(true);
                }
            } else {
                // Just hide the layer, they presumably selected "none".
                _outlineLayer.setVisibility(false);
            }
        });
        // The base layer has changed, update map using the index of the response layer
        var _handleOutlineLayerChange = Azavea.tryCatch('outline layer changed', function(event, layerIndex){
            _updateOutlineLayer(layerIndex);            
        });

        // Remove any info popup bubble on the map
        var _removePopup = Azavea.tryCatch('remove popup', function() {
            if (_popup) {
                _map.removePopup(_popup);
            }
        }); 

        // Render a button on the target to zoom into the coordinates provided
        var _renderPopupZoom = Azavea.tryCatch('render popup zoom', function(lonlat, $target) {
            $('<button id="pdp-map-popup-zoom-button" class="pdp-button left">Zoom Here</button>')
                .button()
                .appendTo($target)
                .click(function() {
                    _trackPopup = true;
                    _removePopup();
                    _map.setCenter(lonlat, (_map.getZoom() + 3));
                });
        });

        // For clustered markers, create a pager for the bubble that the user can cycle through
        var _renderPopupPager = Azavea.tryCatch('render popup pager', function(length, $target, resultsTruncated) {
            //One based!
            var curIndex = 1,
                labelDelim = resultsTruncated ? ' of first ' : ' of ';
            
            // Figure out our current index.  We start at one, unless there is a propertyId we're tracking, in
            // which case we need to use the index of that propertyID, unless it does not exist, in which case we
            // just use one also.
            if (_trackPopup &&  _popupIndexByPropertyId[_popupPropertyId]) {
                // 1 based
                curIndex = _popupIndexByPropertyId[_popupPropertyId] + 1;
            }
            
            // Call for a click event on the pager
            function handlePagerClick($next, $prev) {
                // Determine if we're at begining or end of the list
                if (curIndex > length) {
                    curIndex = 1;
                }

                if (curIndex < 1) {
                    curIndex = length;
                }
                
                // Set the tracked popup propertyId from the index
                _popupPropertyId = _popupPropertyIdByIndex[curIndex -1];
                
                // Hide any open popup panels, and show the current panel for the index
                $('.pdp-shortview-property').hide();
                $('#pdp-popup-property-' + curIndex).show();
                $('.pdp-map-popup-pager-summary').text(curIndex + labelDelim + length + ' Properties');
            }
            
            if (length > 1) {
                // Create the markup for the pager
                $target.append(
                    '<div class="ui-corner-all pdp-map-popup-prev" title="View Previous Property">' +
                        '<span class="ui-icon ui-icon-triangle-1-w"></span>' +
                    '</div>' +
                    '<div class="ui-corner-all pdp-map-popup-next" title="View Next Property">' +
                        '<span class="ui-icon ui-icon-triangle-1-e"></span>' +
                    '</div>' +
                    '<div class="ui-widget-content ui-corner-all pdp-map-popup-pager-summary">' + curIndex + labelDelim + length + ' Properties</div>'
                ).show();
                
                // Cache the selectors for the prev/next buttons
                var $next = $('.pdp-map-popup-next', $target),
                    $prev = $('.pdp-map-popup-prev', $target);
                
                // Bind click event for next    
                $next.click(function(){
                    curIndex++;
                    handlePagerClick($next, $prev);
                });
                
                // Bind click event for prev
                $prev.click(function(){
                    curIndex--;
                    handlePagerClick($next, $prev);
                });
            } else {
                $target.hide();
            }
        });
        
        // Render a short info panel for each property on this popup.
        var _renderPopupContents = Azavea.tryCatch('render popup contents', function(idIndex, data, $target) {
            var listItems, 
                label,
                value,
                caption,
                id,
                $property;

            $target.empty();
            _popupPropertyIdByIndex = [];
            _popupIndexByPropertyId = {};
            
            //Manually add a decent looking jQueryUI close icon
            $('.olPopupCloseBox')
                .html('<span class="ui-icon ui-icon-circle-close"></span>')
                .click(function() {
                    // Function on popup click to no longer track the popup
                    _trackPopup = false;
                    _popupPropertyId = -1;
            });

            $.each(data.Values, function(j, record) {
                $property = $('<div id="pdp-popup-property-' + (j+1) + '" class="pdp-shortview-property"><div class="pdp-shortview-caption"></div><ul class="pdp-shortview-list"></ul><div class="pdp-shortview-link"></div></div>');
                listItems = '';
                id = record[idIndex];
                
                // Keep a cache so the pager can quickly find what PropertyId is selected
                _popupPropertyIdByIndex.push(id);
                _popupIndexByPropertyId[id] = j;
                
                $.each(data.Attrs, function(i, attr) {
                    show = true;
                    // Locate the Property Name for our caption, which may be null and mark it to not show in list
                    if (attr.Name === 'Property Name') {
                        caption = record[i] || '';
                    } else if (attr.ShortOrder && (_options.hideNoValues ? (record[i] || record[i] === 0) : true) ) {
                        // Show this attribute value (unless hideNoValues = true and there is no value)
                        label = '<label class="pdp-shortview-label">' + attr.Name + ':</label>';
                        value = '<label class="pdp-shortview-value">' + P.Util.renderers[attr.ValType](record[i]) + '</label>';
                        listItems += '<li class="pdp-shortview-list-item">' + label + value + '</li>'; 
                    }
                });
                
                // Remove any existing list and append new list to the dialog container
                $('.pdp-shortview-list', $property).empty().append(listItems);
                $('.pdp-shortview-caption', $property).html(caption);
                
                $('.pdp-shortview-link', $property)
                    .html('<a class="pdp-property-details-' + id + '" href="javascript:void(0);">More Details</a>')
                    .click(function(){
                        $(P.Pdb).trigger('pdp-pdb-show-longview', [record, data.Attrs]);
                    });

                //Only show the first one by default
                
                if (j > 0 ) {
                    $property.hide();
                } else if (_popupPropertyId === -1){
                    // Track the property Id of the selected for the purpose of adding the popup after a zoom
                    _popupPropertyId = id;
                }
                
               if (_trackPopup && id === _popupPropertyId) {
                    // Clear any previously displayed property pages
                    $('.pdp-shortview-property').hide();
                    
                    // Show our particular property that we're trackingID
                    $property.show();
                }
                
                $target.append($property);
            });
        });

        // For a given marker, display a popup for the array of property ids
        var _addPopup = Azavea.tryCatch('add popup', function(marker, idArray) {
            var max = 100, 
                truncateResults = (idArray.length > max),
                ids;
                // Only display results up to max number
                if (truncateResults) {
                    ids = idArray.slice(0, max).join(',');
                } else {
                    ids = idArray.join(',');
                }
            
            // Remove any existing popups
            _removePopup(_popup);
            
            // Create a basic info bubble with loading... text
            var content = '<div class="pdp-map-popup-pager"></div><div id="pdp-map-popup-container">Loading...</div><div class="pdp-map-popup-footer"><div class="pdp-map-popup-zoom"></div></div>';
            
            // Track clicking on a map marker, type and number of properties represented by marker
            P.Util.trackMetric('Map', 'Click Marker', idArray.length > 1 ? 'Cluster' : 'Single', idArray ? idArray.length : 1);
            
            // Create and cache the popup
            _popup = new OpenLayers.Popup.FramedCloud('pdb-popup',
                marker.lonlat,
                new OpenLayers.Size(200, 200),
                content,
                null, true
            );
            
            // Display it on the map
            _map.addPopup(_popup, true);
            
            // Get property details for this group of ids
            P.Data.getPropertyDetails(ids, function(data) {
                var idIndex = P.Util.getAttrIndex(data.Attrs, 'UID');
                // Display the popup info and controls
                _renderPopupContents(idIndex, data, $('#pdp-map-popup-container'));
                _renderPopupPager(data.Values.length, $('.pdp-map-popup-pager'), truncateResults);
                _renderPopupZoom(marker.lonlat, $('.pdp-map-popup-zoom'));
                
                // We are done tracking anything.  A zoom will re-enable the flag
                _trackPopup = false;
            });
        });

        // Add single property markers to the map
        var _addMarker = Azavea.tryCatch('add marker', function(property) {
            //var markerPath = 'client/css/images/markers/map-indicator.png';
            // Client requested image be hosted off-domain to give them more styling options
            var markerPath = 'http://www.furmancenter.org/tweaks/map-indicator.png';
            
            // Add the marker and assign a click function
            var size = new OpenLayers.Size(24,24);  // previous size: 21, 25
            var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
            var icon = new OpenLayers.Icon(markerPath, size, offset);
            
            var marker = new OpenLayers.Marker(new OpenLayers.LonLat(property.X, property.Y), icon);
            marker.events.register('click', marker, function() {
                _addPopup(marker, [ property.Key ]);
            });
            
            _pdbLayer.addMarker(marker);
            
           // If this is the marker that contains our property that had a popup before, add the popup back
            if (_trackPopup === true && _popupPropertyId === property.Key ) {
                _addPopup(marker, [ property.Key ]);
            }           
                        
            $('#' + icon.imageDiv.id).addClass('pdp-map-icon');
        });

        // Add markers that represent clustered properties to the map
        var _addClusterMarker = Azavea.tryCatch('add cluster marker', function(cluster) {
            var radius = 22 + Math.floor((Math.log(cluster.Keys.length) * 2) + Math.log(cluster.Keys.length / 10) * 5);

            // Create the icon the for the, including size (based of off the radius of the cluster area)
            var markerPath = 'client/css/images/markers/marker-cluster-bg.png';
            var size = new OpenLayers.Size(1, 1);
            var offset = new OpenLayers.Pixel(-(radius/2), -(radius/2));
            var icon = new OpenLayers.Icon(markerPath, size, offset);

            // Create the marker, add it to the map and add a click event to it to display a popup
            var marker = new OpenLayers.Marker(new OpenLayers.LonLat(cluster.X, cluster.Y), icon);
            marker.events.register('click', marker, function() {
                _addPopup(marker, cluster.Keys);
            });

            _pdbLayer.addMarker(marker);

            // If this is the marker that contains our property that had a popup before, add the popup back
            if (_trackPopup === true) {
                if ($.inArray(_popupPropertyId, cluster.Keys) > -1 ){
                    _addPopup(marker, cluster.Keys);
                }
            }
            
            // Display for marker label
            var labelCss = { opacity:0.9, height:radius, width:radius, lineHeight:radius + 'px', '-moz-border-radius': radius + 'px', '-webkit-border-radius': radius + 'px' };
        
            // Add a label over the image, make the image the correct size, and the clustered property keys to the [rel] of the market div
            var $markerDiv = $('#' + icon.imageDiv.id).css('width', radius).addClass('pdp-map-aggregated-icon').attr('rel', cluster.Keys.join(','));
            $('img', $markerDiv).css({ width: radius + 'px', height: radius + 'px' });
            $('<span class="pdp-map-marker-aggregated-label">' + cluster.Keys.length + '</span>').css(labelCss).appendTo($markerDiv);
        });

        // Data is returned for property info, place markers on the map.  Results are in two groups:
        //  Singles - which are non-clustered individual properties, and Clusters - which are points representing
        //  multiple results near the same lat/long.  These get different markers and popups.
        var _handlePdbMapResponse = Azavea.tryCatch('handle pdb map response', function(event, data){
            
            // Clear the current results from the map
            _pdbLayer.clearMarkers();
            _removePopup();
            
            // Add both signle and clustered markers
            var i;
            if (data.Singles){
                for (i=0; i<data.Singles.length; i++) {
                    _addMarker(data.Singles[i]);
                }
            }
            if (data.Clusters){
                for (i=0; i<data.Clusters.length; i++) {
                    _addClusterMarker(data.Clusters[i]);
                }
            }
        });

        var _handleMapZoomTo = Azavea.tryCatch('Zoom to a specific region of the map', function(event, left, bottom, right, top, flashx, flashy) {
            // This is coming in as lat/lon, we want spherical mercator.
            var bounds = new OpenLayers.Bounds(left, bottom, right, top);
            bounds.transform(_proj, _map.getProjectionObject());
            // Mark the flash point to be flashed once the zoom is complete.
            if (flashx && flashy) {
                _pointToFlash = {x: flashx, y: flashy};
            }
            _map.zoomToExtent(bounds, true);
        });
        
        var _flashMapPoint = Azavea.tryCatch('flash map point', function(event) {
            if (_pointToFlash) {
                setTimeout(function () {
                    var point = new OpenLayers.LonLat(_pointToFlash.x, _pointToFlash.y);
                    point.transform(_proj, _map.getProjectionObject());
                    var pixel = _map.getPixelFromLonLat(point);
                    _$flashPointElement.css('left', pixel.x).css('top', pixel.y).show().effect('puff');
                    _pointToFlash = null;
                }, 500);
            }
        });

        // Trigger a data request for the current map extent
        var _triggerPdbDataRequest = Azavea.tryCatch('pdb data request', function(event){
            //Transform from mercator to lat/lon
            var bbox = _map.getExtent();
            $(P.Pdb).trigger('pdp-map-data-request', [ bbox.left, bbox.bottom, bbox.right, bbox.top ]);
        });
        
        var _onMoveEnd = Azavea.tryCatch('on moveend', 
            Azavea.doLast(200, function(event) {
                // Update PDB data if necessary.
                _triggerPdbDataRequest(event);
                // Flash a point on the map if necessary.
                _flashMapPoint(event);
                _trackPopup = true;
                
            })
        );
                            
        // Bind to events this widget cares about 
        var _bindEvents = Azavea.tryCatch('bind map events', function(){
            
            // Handles event for changing of base layer for layer control
            $(_options.bindTo).bind('pdp-map-base-layer-changed', _handleBaseLayerChange);
            
            // Handles event for changing the current nychanis layer from the layer control slider
            $(P.Nychanis).bind('pdp-nychanis-layer-change', _handleNychanisLayerChange);
            
            // Handles event for changing the current outline layer from the outline layer control
            $(_options.bindTo).bind('pdp-map-outline-layer-changed', _handleOutlineLayerChange);

            // Handles event for changing the current outline layer from the outline layer control
            $(_options.bindTo).bind('pdp-map-zoom-to', _handleMapZoomTo);
            
            // Handle the return of pdb map data
            $(P.Pdb).bind('pdp-map-data-response', _handlePdbMapResponse);
            
            // When we force a data request
            $(P.Pdb).bind('pdp-data-force-update', _triggerPdbDataRequest);
            
            // Show hide pdb marker layer from layer control
            $(P.Pdb).bind('pdp-pdb-layer-toggle', function(event, show){
                // Track the toggling of property markets
                P.Util.trackMetric('Map', 'Property Markers', show ? 'Display' : 'Hide');
                
                _pdbLayer.setVisibility(show);
            });
            
            // Show hide nychanis layer from layer control
            $(P.Nychanis).bind('pdp-nyc-layer-toggle', function(event, show){
                if (_nychanisLayer) {
                    // Track the toggling of property markets
                    P.Util.trackMetric('Map', 'Nychanis Layer', show ? 'Display' : 'Hide');
                    _nychanisLayer.setVisibility(show);
                }
            });
                        
            // Reset request from pdb - clear the map
            $(P.Pdb).bind('pdp-criteria-reset', function(event) {
                _pdbLayer.clearMarkers();
                _popupPropertyId = -1;
                _removePopup();
            });
            
            // Reset request from nychanis - clear the map
            $(P.Nychanis).bind('pdp-criteria-reset', function(event) {
                if (_nychanisLayer){
                    _map.removeLayer(_nychanisLayer);
                }
                _nychanisLayer = null;
            });
            
            // Ask for more pdb property data when the map is moved 
            _map.events.register('moveend', _map, _onMoveEnd);
        });
        
        // Render the map to the display
        var _render = Azavea.tryCatch('render map', function() {
            $target = $(_options.target);
            _$flashPointElement = $('<div id="pdp-map-flash-point"/>').appendTo($target).hide();
        
            // Initialize the map and controls
            _map = new OpenLayers.Map($target[0].id, {
                projection: new OpenLayers.Projection('EPSG:900913'),
                displayProjection: new OpenLayers.Projection('EPSG:4326'),
                units: 'm',
                maxZoomLevel: 17,
                minZoomLevel: 9,
                maxExtent: _options.defaultBbox,
                restrictedExtent: _options.maxBbox,
                controls: [
                    new OpenLayers.Control.PanPanel(),
                    new OpenLayers.Control.ZoomPanel(),
                    new OpenLayers.Control.Navigation(),
                    new OpenLayers.Control.ArgParser(),
                    new OpenLayers.Control.Attribution(),
                    new OpenLayers.Control.ScaleLine()
                ]
            });
            
            // Set up map defaults
            _map.addLayers(_options.layers);

            // Create and add a layer for the area outlines (like boroughs, etc).
            _outlineLayer = new OpenLayers.Layer.WMS(
                'outlines', P.Config.Outlines.Server,
                    { /* before one is chosen, no layer config is available. */ },
                    {
                        isBaseLayer: false,
                        tileSize: new OpenLayers.Size(500,500),
                        buffer: 0,
                        displayOutsideMaxExtent: true
                    }
                );
            // It starts out invisibile.
            _outlineLayer.setVisibility(false);
            _map.addLayer(_outlineLayer);
            
            // Create and add a pdb marker layer
            _pdbLayer = new OpenLayers.Layer.Markers('pdb');
            _map.addLayer(_pdbLayer);

            // Zoop to the default area
            _map.zoomToExtent(_options.defaultBbox, true);
        });
            
        // Initialize the map    
        _self.init = Azavea.tryCatch('init map and related controls', function() {
            _render();
            
            // Bind to events this widgets needs to hear
            _bindEvents();
            
            // Set up layer widget
            P.Widget.Map.Layers({
                target: '#pdp-map-layers-content'
            }).init();
            
            // Set up geocode widget
            P.Widget.Map.Geocode({
                target: '#pdp-map-geocode-content'
            }).init();
            
            // Trigger an event with the max bbox 
            $(P).trigger('pdp-map-max-bbox', [_options.maxBbox.toArray()]);
            
            return _self;
        });
        
        return _self;
    };
}(PDP));
