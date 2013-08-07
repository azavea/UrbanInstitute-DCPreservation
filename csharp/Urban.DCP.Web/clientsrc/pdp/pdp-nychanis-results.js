(function(P) {
    P.Nychanis.Results = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Nychanis
            }, options),
            $mapTitle,
            $tableTitle,
            _table,
            _indicatorState,
            _resolutionState,
            _timeState, 
            _userRole = 'Public';

        // Parse the current search criteria into trackable analytics
        var _submitAnalytics = Azavea.tryCatch('submit pdb analytics', function(totalResults){
            var action = 'Nychanis | Search',
                label = '';
            
            // Track the features of this nychanis search
            label = 'Indicator = ' +  _indicatorState.Name;
            label += '| Resolution = ' +  _resolutionState.resolutionName; 
            if (_resolutionState.scopeName){
                label += '| Scope = ' + _resolutionState.scopeName;   
            }
            if (_resolutionState.subScopeName){
                label += '| Subscope = ' + _resolutionState.subScopeName;   
            }            
            
            label += '| TimeType = ' + _timeState.typeName;
            label += '| MinYear = ' + _timeState.minYear;
            label += '| MaxYear = ' + _timeState.maxYear;   
            
            P.Util.trackMetric(_userRole, action, label, totalResults);
            
        });

        var _updateLayout = Azavea.tryCatch('update nychanis table layout', function(){
            // Get the height of the table toolbar
            var h = parseFloat($(options.tableTitleTarget).height());
            if (h === 0){
                h = 50;
            }
            
            $(options.tableTarget).css('margin-top', h + 'px');
            $(options.tableTarget).css('top', '0px');
        });
        
        // The map and table will have different titles because the user sees only 1 year at a time
        //  on the map, and several years at once in the table.  They need to account for this difference
        var _updateTitle = Azavea.tryCatch('update nychanis title', function(mapYear) {
            var timePart, mapTimePart, mapTitle, title, h;
            
            if (_timeState.minYear === _timeState.maxYear) {
                timePart = ' for ' + _timeState.minYear;
            } else {
                timePart = ' from '  + _timeState.minYear + ' to ' + _timeState.maxYear;
            }
            
            title = _indicatorState.Name + ' by ' + _resolutionState.resolutionName + timePart;
            
            // Assemble the map title based on the information we have
            mapTimePart = mapYear ? ' for ' + mapYear : '';
            mapTitle = _indicatorState.Name + ' by ' + _resolutionState.resolutionName + mapTimePart;
            
            // Remove the "no search yet" message
            $('#pdp-nyc-table-uninitialized').remove();
            
            $mapTitle.html(mapTitle).show();
            $tableTitle.html(title).show();
            
        });

        var _getData = Azavea.tryCatch('get nychanis data', function(page, pageSize, colIndex, sortAsc) {
           
            P.Data.getNychanis(pageSize, page, colIndex, sortAsc,
                _indicatorState.UID, _resolutionState.resolution, _timeState.type,
                _timeState.minYear, _timeState.maxYear, _resolutionState.scope, _resolutionState.subScope,
                function(data) {
                    // Submit analytics for this search
                    _submitAnalytics(data.TotalResults);
                    
                    _updateTitle();
                    
                    // Update the layout
                    _updateLayout();
                               
                    $(_options.bindTo).trigger('pdp-data-response', [data]);
                }, function(){
                    // Error, tell loading indicator to go away
                    $(_options.bindTo).trigger('pdp-loading-finished');
                });
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
                
        var _bindEvents = Azavea.tryCatch('bind nychanis result events', function(){
            
            // Login status            
            $(_options.bindTo).bind('pdp-login-status-refresh', function(event, user){
                _setUserRole(user);
            });
             $(P).bind('pdp-login-success', function(event, user){
                _setUserRole(user);
            });
                        
            $(_options.bindTo).bind('pdp-data-request', function(event, page, pageSize, colIndex, sortAsc) {
                _getData(page, pageSize, colIndex, sortAsc);
            });
            
            $(_options.bindTo).bind('pdp-nychanis-indicator-change', function(event, state) {
                _indicatorState = state;
            });
            
            $(_options.bindTo).bind('pdp-nychanis-resolution-change', function(event, state) {
                _resolutionState = state;
            });

            $(_options.bindTo).bind('pdp-nychanis-time-change', function(event, state) {
                _timeState = state;
            });
            
            $(_options.bindTo).bind('pdp-export-request', function(event) {
                // Track export request
                P.Util.trackMetric(_userRole, 'Nychanis | Export' );
                P.Data.getNychanisCsv(_indicatorState.UID, _resolutionState.resolution, _timeState.type,
                        _timeState.minYear, _timeState.maxYear, _resolutionState.scope, _resolutionState.subScope);
            }); 
            
            $(_options.bindTo).bind('pdp-nychanis-layer-change'  , function(event, data, index, value) {
                _updateTitle(value);
            });
            
            $(_options.bindTo).bind('pdp-criteria-reset', function() {
                $mapTitle.hide();
                $tableTitle.hide();
                _displayNoQueryMsg();
            });
            
            $(window).resize(function() {
                _updateLayout();
            });        
        });

        // Displays a message in the empty space where a table will be
        var _displayNoQueryMsg = Azavea.tryCatch('display pdb no query message', function(){
            if ($('#pdp-nyc-table-uninitialized').length === 0){
                $(options.tableTitleTarget).append('<div id="pdp-nyc-table-uninitialized" class="pdp-table-uninitialized">' + 
                            '<img src="client/css/images/table-icon.png"/>' +
                            '<div>There is no data selected to generate a table.  Please select an indicator to the left to view neighborhood information.</div>' + 
                        '</div>');
            }
        });

        //Render placeholders to the target
        var _render = Azavea.tryCatch('render nychanis search', function() {
            $mapTitle = $('<div id="pdp-nychanis-map-title" class="pdp-map-title"></div>').hide().appendTo(_options.mapTitleTarget);
            $tableTitle = $('<div id="pdp-nychanis-table-title" class="pdp-table-title"></div>').hide().appendTo(_options.tableTitleTarget);
        });

        _self.init = Azavea.tryCatch('init nychanis results', function() {
            _render();
            _bindEvents();
            _displayNoQueryMsg();
            
            //Init the table widget. This should automagically support
            //list and aggregation queries, plus sorting and paging.
            _table = P.Widget.Table({
                target: _options.tableTarget,
                pagerTarget: _options.tablePagerTarget,
                bindTo: P.Nychanis,
                altRowClass: 'pdp-table-row-alt-nyc'
            }).init();

            P.Widget.Export({
                target: _options.exportTarget,
                bindTo: P.Nychanis
            }).init();
            
            return _self;
        });
        
        return _self;
    };
}(PDP));