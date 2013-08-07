(function(P) {
    P.Pdb.Results = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Pdb
            }, options),
            _table,
            _criteria,
            _groupBys,
            _longview,
            _cachedMapData,
            _cachedMapExtent,
            _countMode,
            _userRole = 'Public', // Used only for analytics, no actual security
            _activeCriteria,
            _activeGroupBys,
            _activeCountMode,
            _$mapTitle,
            _$tableTitle,
            _$mapCountTitle,
            _$mapDisplayTitle;

        // Parse the current search criteria into trackable analytics
        var _submitAnalytics = Azavea.tryCatch('submit pdb analytics', function(criteria, groupBys, totalResults){
            var i,
                label = '',
                oper = '',
                value = '',
                list = '',
                action = 'Properties | Search';
                
            if (groupBys && groupBys.length){
                action = 'Properties | Aggregate';
            }
            
            // Loop through the criteria and submit the metric
            for(i=0;i<criteria.length;i++){
                // Parse the criteria into a label and value
                label = criteria[i].attr;
                value = criteria[i].val;
                switch (criteria[i].oper){
                    case 'eq':
                        oper = '=';
                        break;
                    case 'ge':
                        oper = '>=';
                        break;
                    case 'le':
                        oper = '<=' ;
                        break;
                }
                
                list += label + oper + value + ' | ';
                
            }
            
            // Remove last | 
            list = list.substring(0, list.length - 2);
                        
            // Loop through the groupbys and track them also
            if (groupBys && groupBys.length){
                list += ' Aggregate By('; 
                for(i=0;i<groupBys.length;i++){
                    list += groupBys[i] + ', '; 
                }
                list = list.substring(0, list.length-2 ) + ')';
            }
            
            P.Util.trackMetric(_userRole, action, list ? list : '[No Criteria]', totalResults);
            
        });
        
        // Updates the map title to say how many properties are actually displayed at the moment
        var _updateMapDisplayTitle = Azavea.tryCatch('update pdb map title', function(resultCount, countMode) {
            
            if (countMode){ 
                var propLabel = resultCount === 1 ? ' SHIP property' : ' SHIP properties';
                _$mapCountTitle.hide();
                _$mapDisplayTitle.html('Displaying ' + P.Util.renderers.integer(resultCount) + propLabel);
            }else{
                // Show the title for map display properties
                _$mapCountTitle.show();
                _$mapDisplayTitle.html(', displaying ' + P.Util.renderers.integer(resultCount) + ' on the map');
            }
        });
        
        // The map and table will have different titles
        var _updateTitle = Azavea.tryCatch('update pdb title', function(data, countMode) {
            var mapTitle, title, 
                totalIndex = -1, propSum = 0, mapCount;
            var recLabel;
            var propLabel;
            
            // When logging in/out this gets fired with no value
            if (!data){
                return;
            }
                
            if (countMode){   
               // Work out our plural
                recLabel = ' records';
                propLabel = ' SHIP properties';
                if (data.TotalResults === 1 ){
                    recLabel = ' record';
                }

                // The title includes how many records were returned, property counts are returned in total
                title = P.Util.renderers.integer(data.TotalResults) + recLabel + ' returned'; 
                
                // We don't need extra spacing for this type of query, there is no column selector button
                $('#pdp-pdb-table-title').removeClass('pdp-pdb-table-title-details');
                                
                // We have no property counts, so hide that title
                _$mapCountTitle.hide();
            } else {
            
                // We do need extra spacing for this type of query, there is no column selector button
                $('#pdp-pdb-table-title').addClass('pdp-pdb-table-title-details');
                            
                // This is a details search, both numbers are total values
                mapCount = P.Util.renderers.integer(data.TotalResults);
                
                recLabel = ' records';
                propLabel = ' SHIP properties';
                
                if (data.TotalResults === 1 ){
                    propLabel = ' SHIP property';
                }
                // Work out the titles for count and description
                title = mapCount + propLabel + ' meet your criteria';
                
                // Place the titles
                _$mapCountTitle.show().html(title);
            }
            
            // Remove the "no search yet" message
            $('#pdp-pdb-table-uninitialized').remove();
            
            // The map may not have updated on this search, so manually call the update map title routine
            if (_cachedMapData && ( _cachedMapData.totalResults || _cachedMapData.totalResults === 0)){
                _updateMapDisplayTitle(_cachedMapData.totalResults, countMode);
            }

            _$mapTitle.show();
            _$tableTitle.html(title).show();
            
        });
                
        //Fetch the map data (points and clusters) for the criteria
        var _getMapData = Azavea.tryCatch('get pdb map data', function(criteria, minx, miny, maxx, maxy) {
            
            // If we are in counts mode, and there are no groupbys - let the user know they must select
            //  counts first.
            if (_activeCountMode && _activeGroupBys.length < 1){
                $(_options.bindTo).trigger('pdp-loading-finished');
                $(_options.bindTo).trigger('pdp-show-counts-panel');
                return;    
            }
            
            if (criteria) {
                // Use a string version of the criteria because it makes checking for changes
                // a lot easier.
                var critStr = JSON.stringify(criteria);
                var width = maxx - minx;
                var height = maxy - miny;
                if (_cachedMapData) {
                    if ((critStr === _cachedMapData.critStr) && 
                            // For some reason, height/width varied by small amounts after panning.
                            (Math.abs(width - _cachedMapData.origWidth) < 2) &&
                            (Math.abs(height - _cachedMapData.origHeight) < 2) &&
                            (maxx <= _cachedMapData.maxx) &&
                            (maxy <= _cachedMapData.maxy) &&
                            (minx >= _cachedMapData.minx) &&
                            (miny >= _cachedMapData.miny)) {
                        // This request isn't outside the bounds we asked for last time, and it is
                        // at the same zoom level and screen size as last time, so no need to change
                        // anything.
                        return;
                    }
                }
                // Request a larger area so we don't re-request on every pan (which causes the
                // groupings to jump around a lot).
                var oversizeMinX = minx - width;
                var oversizeMinY = miny - height;
                var oversizeMaxX = maxx + width;
                var oversizeMaxY = maxy + height;
                
                // Pass in the full map bbox so we can get a count of available properties on the map
                var minBoundsX = _cachedMapExtent[0], maxBoundsX = _cachedMapExtent[2], minBoundsY = _cachedMapExtent[1], maxBoundsY = _cachedMapExtent[3];
                
                P.Data.getPropertyLocations(criteria, oversizeMinX, oversizeMinY, oversizeMaxX, oversizeMaxY, minBoundsX, minBoundsY, maxBoundsX, maxBoundsY,
                    function(data) {
                        _cachedMapData = {
                            critStr: critStr,
                            minx: oversizeMinX,
                            maxx: oversizeMaxX,
                            miny: oversizeMinY,
                            maxy: oversizeMaxY,
                            origHeight: height,
                            origWidth: width,
                            totalResults: data.TotalMapResults
                        };
                        
                        // Update map title
                        _updateMapDisplayTitle(data.TotalMapResults, _activeCountMode);
                        
                        $(_options.bindTo).trigger('pdp-map-data-response', [ data ]);
                    }, function(){
                        // Error, tell loading indicator to go away
                        $(_options.bindTo).trigger('pdp-loading-finished');
                    }
                );
            }
        });

        //Get the raw data for the given criteria
        var _getData = Azavea.tryCatch('get pdb data', function(criteria, groupBys, page, pageSize, colIndex, sortAsc) {
            
            // If we are in counts mode, and there are no groupbys - let the user know they must select
            //  counts first.
            if (_activeCountMode && groupBys.length < 1){
                $(_options.bindTo).trigger('pdp-loading-finished');
                $(_options.bindTo).trigger('pdp-show-counts-panel');
                return;    
            }
            
            P.Data.getProperties(criteria, pageSize, page, colIndex, sortAsc, groupBys,
                function(data) {
                    
                    _updateTitle(data, _activeCountMode);
                    
                    // Submit analytics for this search, if it is a 1st page
                    // so we don't subumit for every page next or col sort
                    if (page === 1 && colIndex < 0){
                        _submitAnalytics(criteria, groupBys, data.TotalResults);
                    }
                    
                    // GroupBy queries do not get a details column
                    if (!groupBys || groupBys.length === 0){
                        data.ExtraAttrs = [
                            { Name: 'Details', ValType: 'propertyDetails' }
                        ];                      
                    }else {
                        data.GroupByQuery = true;
                    }                    
                    $(_options.bindTo).trigger('pdp-data-response', [ data ]);
                }, function(){
                    // Error, tell loading indicator to go away
                    $(_options.bindTo).trigger('pdp-loading-finished');
                }
            );
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
                
        var _bindEvents = Azavea.tryCatch('bind pdb result events', function(){
            
            // Login status            
            $(P).bind('pdp-login-status-refresh', function(event, user){
                _setUserRole(user);
            });
             $(P).bind('pdp-login-success', function(event, user){
                _setUserRole(user);
            });

            // Bind to get a call with max bbox so we can get a count of properties available on the map
            $(P).bind('pdp-map-max-bbox', function(event, maxBounds){
                _cachedMapExtent = maxBounds;

            }); 
                        
            $(_options.bindTo).bind('pdp-data-force-update', function(){
                //Indicate that the search button has been pressed, even if no criteria selected
                _activeCriteria = $.extend(true, [], _criteria || []);
                _activeGroupBys = $.extend(true, [], _groupBys || []);
                _activeCountMode = _countMode;
            });
            
            //Someone asked for data - go get it
            $(_options.bindTo).bind('pdp-data-request', function(event, page, pageSize, colIndex, sortAsc) {
                _getData(_activeCriteria, _activeGroupBys, page, pageSize, colIndex, sortAsc);
            });
            
            //Someone asked for map data 
            $(_options.bindTo).bind('pdp-map-data-request', function(event, minx, miny, maxx, maxy) {
                _getMapData(_activeCriteria, minx, miny, maxx, maxy);
            });
            
            //The criteria changed - save it.
            $(_options.bindTo).bind('pdp-pdb-criteria-change', function(event, criteria) {
                // Deep copy the criteria, an array of objects - we want the values not the ref
                _criteria = $.extend(true, [], criteria || []);
            });
            
            //The aggregations columns changed
            $(_options.bindTo).bind('pdp-pdb-aggregations-change', function(event, groupBys, countMode) {
                // Deep copy the groupBys, an array of objects - we want the values not the ref
                _groupBys = $.extend(true, [], groupBys || []);
                _countMode = countMode;
            });
            
            // Reset request.
            $(_options.bindTo).bind('pdp-criteria-reset', function() {
                // Blow away the map criteria cache so that subsequent queries, if it was the same criteria
                //  will actually be searched on.
                _cachedMapData = {};
                _activeCriteria  = null;
                _$mapTitle
                    .hide()
                    .children()
                    .empty();
                    
                _$tableTitle.empty().hide();
                _displayNoQueryMsg();
            });
            
            //Export the CSV
            $(_options.bindTo).bind('pdp-export-request', function(event) {
                // Track export request
                P.Util.trackMetric(_userRole, 'Properties | Export');
                P.Data.getPropertiesCsv(_activeCriteria, _activeGroupBys);
            });
            
        });
        
        // Displays a message in the empty space where a table will be
        var _displayNoQueryMsg = Azavea.tryCatch('display pdb no query message', function(){
            if ($('#pdp-pdb-table-uninitialized').length === 0){
                $(options.tableTitleTarget).append('<div id="pdp-pdb-table-uninitialized" class="pdp-table-uninitialized">' + 
                            '<img src="client/css/images/table-icon.png"/>' +
                            '<div>There is no data selected to generate a table.  Please use the criteria on the left to select data for your search.</div>' +
                        '</div>');
            }
        });
                
       //Render placeholders to the target
        var _render = Azavea.tryCatch('render nychanis search', function() {
            _$mapTitle = $('<div id="pdp-pdb-map-title" class="pdp-map-title"><div id="pdp-pdb-title-count"></div><div id="pdp-pdb-title-display"></div></div>').hide().appendTo(_options.mapTitleTarget);
            _$tableTitle = $('<div id="pdp-pdb-table-title" class="pdp-table-title pdp-pdb-table-title"></div>').hide().appendTo(_options.tableTitleTarget);
        });
        
        _self.init = Azavea.tryCatch('init pdb results', function() {
            _bindEvents();
            _render();
            _displayNoQueryMsg();
            
            // Cache some selectors
            _$mapCountTitle = $('#pdp-pdb-title-count');
            _$mapDisplayTitle = $('#pdp-pdb-title-display');
            
            //Init the table widget. This should automagically support
            //list and aggregation queries, plus sorting and paging.
            _table = P.Widget.Table({
                target: _options.tableTarget,
                pagerTarget: _options.tablePagerTarget,
                bindTo: P.Pdb,
                altRowClass: 'pdp-table-row-alt-pdb'
            }).init();
            
            //"Longview" is the modal dialog with streetview and the "long"
            //list of property details
            _longview = P.Widget.Longview({
                hideNoValues: true,
                modal: true,
                resizable: true,
                height: 600,
                width: 800,
                title: 'Property Description'
            }).init();
            
            //Init the column selector widget. This guy will trigger
            //events to tell the table to toggle column visiblity.
            P.Widget.ColumnSelector({
                target: _options.columnSelectTarget,
                bindTo: P.Pdb
            }).init();   

            //In the table export widget. Gets a CSV version of the table data.
            //Doesn't actually interact with the table widget.
            P.Widget.Export({
                target: _options.exportTarget,
                bindTo: P.Pdb
            }).init();
            
            return _self;
        });
        
        return _self;
    };
}(PDP));