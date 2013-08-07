(function(P) {
    P.Widget.Longview = function(options) {
        var _self = {},
            _options = $.extend({
                bindTo: P.Pdb,
                hideNoValues: false,
                resizable: false,
                modal: true,
                height: 750,
                width: 750,
                title: 'Property Description',
                linkText: 'Download Full Report'
            }, options),
            _$container = {},
            _panorama,
            _sv, 
            _$street,
            _userRole;
       
        var _displayNoData = Azavea.tryCatch('display no street view data', function(){
            // No data for this location, display text it
            _$street.empty().html('<div class="pdp-longview-street-none">No image available for this location.</div>');
        });
        
        // When the download link is clicked
        var _downloadReport = Azavea.tryCatch('download full longview report', function(propertyId) { 
            // Track report download
            P.Util.trackMetric(_userRole, 'Properties | Detailed Report Download');
            
            // Make the call into the handler
            P.Data.getPropertyReport(propertyId);
        });
        
        // For the given record and attribute list, render the list and display the dialog
        var _showLongView = Azavea.tryCatch('show long view details window', function(attrs, record) {
            var listItems = '', 
                label = '',
                $table,
                caption = '',
                lat = 0,
                lng = 0,
                show = true,
                propId = -1,
                $link = $('#pdp-download-report'),
                v;
                
            // Loop through each attribute to see if it should be included in the long view
            // and build a list of label/values
            $.each(attrs, function(i, attr) {
                show = true;
                // Locate the Property Name for our caption, which may be null and mark it to not show in list
                if (attr.UID === 'PropertyName') {
                    caption = record[i] ? record[i] : '';
                    show = false;
                }
                
                // Pluck out the lat/lng so we can find it on Street View
                if (attr.UID === 'Lat') {
                    lat = record[i];
                }
                if (attr.UID === 'Lon') {
                    lng = record[i];
                }
                
                // Also find the Property Id to pass to the download report function
                if (attr.UID === 'UID') {   
                    propId = record[i];
                }

                // Show this attribute value (unless hideNoValues = true and there is no value)
                if (show && attr.LongOrder && (_options.hideNoValues ? record[i] || record[i] === 0 : true) ) {
                    label = '<label class="pdp-longview-label">' + attr.Name + ':</label>';
                    if ($.isArray(record[i])){
                        // For this list, we just want to comma delimit the array
                        v = record[i].join(', ');
                    }
                    else if (P.Util.renderers[attr.ValType]){
                        v = P.Util.renderers[attr.ValType](record[i]);
                    }else{
                        v = record[i];
                    }
                    listItems += '<tr><td>' + label + '</td>' + 
                                     '<td><div class="pdp-longview-value">' + v + '</div></td></tr>'; 
                }
            });
            
 
            
            // Track longview showing
            P.Util.trackMetric(_userRole, 'Properties | Display Longview');
            
            // If we didn't find a propertyId, don't show a link
            if (propId === -1){
                $($link, _$container).hide();
            }else {
                P.Data.checkPropertyReportExists(propId, function(resp){
                    if (resp.Exists){
                        // The link is valid, register the click event for our download link and 
                        //  remove any previous bindings
                        $($link, _$container).unbind('click').click(function(){
                            _downloadReport(propId);
                        }).show();
                    }else{
                        // The report doesn't exist, don't give the option
                        $link.hide();
                    }
                });
            }
            
            // Remove any existing list and append new list to the dialog container
            $table = $('#pdp-longview-table', _$container).empty().append(listItems);
           
            // The table is made, style the alt rows
            $('tr:odd', $table).addClass('pdp-table-row-alt-pdb');
            
            // Append the caption, it may be '', in which case there is no caption
            $('.pdp-longview-caption', _$container).empty().append('<span>' + caption + '</span>');
            
            // Get the Google Street View data and add it to container if we have valid coords
            if (lat && lng){
                _getStreetView(lat, lng);
            } else {
               _displayNoData();
            }
            
            // Show the dialog
            _$container.dialog('open');
            
        });
        
        // Determines the yaw between two lat/longs
        var _computeAngle = Azavea.tryCatch('compute streetview angle', function (endLatLng, startLatLng) {
            var DEGREE_PER_RADIAN = 57.2957795;
            var RADIAN_PER_DEGREE = 0.017453;

            var dlat = endLatLng.lat() - startLatLng.lat();
            var dlng = endLatLng.lng() - startLatLng.lng();
            // We multiply dlng with cos(endLat), since the two points are very closeby,
            // so we assume their cos values are approximately equal.
            var yaw = Math.atan2(dlng * Math.cos(endLatLng.lat() * RADIAN_PER_DEGREE), dlat)* DEGREE_PER_RADIAN;
            return _wrapAngle(yaw);
        });

        var _wrapAngle = Azavea.tryCatch('compute wrap angle yaw', function (angle) {
            if (angle >= 360) {
              angle -= 360;
            } else if (angle < 0) {
             angle += 360;
            }
            return angle;
          });

        // Caches the highest role of the current user, for analytics only
        var _setUserRole = Azavea.tryCatch('set user role nychanis', function(user){
                if (user){
                    if (user.Admin || user.Limited){
                        _userRole = 'Agency';
                        return;
                    }
                }        
                _userRole = 'Public';
        });
                          
        // Attempt to get a Google Street View snap of an address
        var _getStreetView = Azavea.tryCatch('get street view data', function(lat, lng) {
            try{
                // Cache our street view here in case google goes down
                if (!_sv){
                    _sv = new google.maps.StreetViewService();
                }
                
                var propLatLng = new google.maps.LatLng(lat.toFixed(6), lng.toFixed(6));
                
                _panorama = new google.maps.StreetViewPanorama(_$street.get(0));
                _panorama.enableCloseButton = false;
                _panorama.linksControl = false;
                
                // Request a panorama with the property lat long.  50 is the smallest radius we can search.          
                _sv.getPanoramaByLocation(propLatLng, 50, function(data, status) {
                    if (status === google.maps.StreetViewStatus.OK){
                        // We have valid street vew data, show the view
                        _$street.show();
                        
                        // Try to determine the yaw/heading towards the property by comparing what we
                        //  asked for to what we got (lat/long) when we requested the panorama.                 
                        var angle = _computeAngle(propLatLng, data.location.latLng);
                        var panoId = data.location.pano;
                        _panorama.setPano(panoId);
                        _panorama.setPov({
                            heading: angle,
                            pitch: 0, 
                            zoom: 1
                            });
                            
                        _panorama.setVisible(true);    
                    }
                    else {
                        _displayNoData();
                    }
                });
            }
            catch(err){
                // If google is having a hard time, just display no data
                _displayNoData();
            }
        });
        
        // Create the dialog that will show longview details, including space for streetview and title
        var _createLongviewDialog = Azavea.tryCatch('create dialog container', function(){            
            // Create div container for caption, the list, and GSV
            _$container = $('<div class="pdp-longview"><div class="pdp-longview-caption"></div><table id="pdp-longview-table" class="pdp-longview-list"></table><div id="pdp-streetview-title">Approximate View</div><div class="pdp-longview-street"></div></div>');
            _$street = $('.pdp-longview-street', _$container);
            
            // Create a link to report download link
            _$container.append('<a id="pdp-download-report" style="display=none;" href="javascript:void(0)">' + _options.linkText + '</a>');
            
            // Tell the DialogUI about the container, with options
            _$container.dialog({
		        autoOpen: false,
		        resizable: _options.resizable,
		        height: _options.height,
		        width: _options.width,
		        modal: _options.modal,
		        title: _options.title,
		        buttons: {
	                Close: function() {
		                $(this).dialog('close');
	                }}
                });
                
                $('button', _$container).addClass('pdp-button');
        });
        
        // Override the P.Util.renderer to place custom code in the ExtraCol
        P.Util.renderers.propertyDetails = function(value, id, record, attrs) {
            // Bind an event for this particular row for later
            $('.pdp-property-details-' + id).die().live('click', function(event) {
                _showLongView(attrs, record);
            });
            
            // Return the link markup
            return '<a class="pdp-property-details-' + id + '" href="javascript:void(0);">'+value+'</a>';
        };
                    
        // Initialize and render dialog
        _self.init = Azavea.tryCatch('init longview widget', function() {
            // Login status            
            $(P).bind('pdp-login-status-refresh', function(event, user){
                _setUserRole(user);
            });
             $(P).bind('pdp-login-success', function(event, user){
                _setUserRole(user);
            });
            
            // Create the container for the UI Dialog
            _createLongviewDialog();
            
            $(_options.bindTo).bind('pdp-pdb-show-longview', function(event, record, attrs){
                _showLongView(attrs, record);
            });
            
            return _self;
        });
        
        return _self;
    };
}(PDP));