(function(P) {
    P.Widget.NychanisResolution = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Nychanis
            }, options),
            _state = {
                resolutionName: '',
                resolution: '',
                scope: '',
                scopeName: '',
                subScope: '',
                subScopeName: ''
            }, 
            _curMetadata = {},
            _resolutionsById = {},
            _$resolution = {},
            _$scope = {},
            _$subScope = {},
            _boroughUID = -1,
            _subBoroughUID = -1;

        // Trigger the event for this widget's state
        var _triggerChange = Azavea.tryCatch('trigger resolution change', function() {
            $(_options.bindTo).trigger('pdp-nychanis-resolution-change', [ _state ]);
        });

        // Update the current state object, trigger the event
        var _updateState = Azavea.tryCatch('trigger indicator change', function(resolution, scope, subScope) {
            _state.resolutionName = _resolutionsById[resolution] ? _resolutionsById[resolution].Name : '';
            _state.resolution = resolution;
            _state.scope = scope;
            
            // Figure out the name of the scope, for tracking purposes
            if (scope){
                _state.scopeName = $('#pdp-nyc-scope :selected').text();
            } else if(_$scope && _$scope.is(':visible')) {
                // If there is no scope selected, but the input is visible, then they are searching for all
                _state.scopeName = 'All Boroughs';
            }else{
                _state.scopeName = '';
            }
            
            // Figure out the name of the subscope, for tracking purposes
            _state.subScope = subScope;  
            if (subScope){
                _state.subScopeName = $('#pdp-nyc-subscope :selected').text();
            } else if(_$subScope && _$subScope.is(':visible')) {
                // If there is no subscope selected, but the input is visible, then they are searching for all
                _state.subScopeName = 'All Sub Boroughs';
            }else{
                _state.subScopeName = '';
            }
            
            // Tell whomever about our current state
            _triggerChange();     
        });
        
        // Generic method for populating resolution select options
        var _renderSelectOptions = Azavea.tryCatch('create select options', function(title, items, target, valueProperty, restrictTo){
            var indOptions = '<option id="" value="" selected=selected>- - ' + title + '- -</option>';
            $.each(items, function(i, item){
                var val = valueProperty ? item[valueProperty] : i;
                
                if (!restrictTo || $.inArray(val, restrictTo) > -1){
                    indOptions += '<option value="' + val + '">' + item.Name + '</option>';
                }
            });
        
            $(target).empty().append(indOptions);
        });
        
        // Gets a list of subboroughs of a particular bourough
        var _getSubBoroughsOfBorough = Azavea.tryCatch('get subboroughs', function(borough){
            var subs = [];

            // Check each subborough and get a list of those that belong to this borough
            $.each(_resolutionsById[_subBoroughUID].Geographies, function(i, sub){
                if (sub.Borough === borough){
                    subs.push(sub);
                }
            });
            
            return subs;
        });
        
        // Reset widget to default state
        var _resetInputs = Azavea.tryCatch('reset resolution inputs', function() {
            // Clear our state
            _updateState('', '', '', '');
            
            // Re-render the controls to blank state
            _$scope.hide();
            _$subScope.hide();  
            _$resolution
                .attr('selectedIndex', 0)
                .attr('disabled', true);
        });        

        // Resolution has changed, update the state and UI
        var _resolutionChanged = Azavea.tryCatch('resolution change', function() {
            if (this.value || this.value === 0){
                // Create our subcategory dropdown, make sure indicator is still hidden
                if (_resolutionsById[parseInt(this.value, 10)].HasBoroughData){
                    _renderSelectOptions('All Boroughs', _resolutionsById[_boroughUID].Geographies , '#pdp-nyc-scope', 'Borough');
                                            
                    _$scope.show();
                    _$subScope.hide();
                } else {
                    // Default category, hide the sub and ind
                    _$scope.hide();
                    _$subScope.hide();     
                } 
             } else {
                _$scope.hide();
                _$subScope.hide();                 
             }
             
            // Announce our state change
            _updateState(this.value, '', '');            
        });  
        
        // Scope has changed, update the state and UI
        var _scopeChanged = Azavea.tryCatch('scope resolution change', function() {
            if ((this.value || this.value === 0) && (_state.resolution || _state.resolution === 0)){
                // Create our subcategory dropdown, make sure subscope is still hidden
                if (_resolutionsById[parseInt(_state.resolution, 10)].HasSubBoroughData){
                    _renderSelectOptions('All Sub Boroughs', _getSubBoroughsOfBorough(this.value) , '#pdp-nyc-subscope', 'SubBorough');                     
                    _$subScope.show();
                }else{
                    // No subscope, hide
                    _$subScope.hide();            
                }
             } else {
                // No subscope, hide
                _$subScope.hide();    
             }
                      
            // Announce our state change
            _updateState(_state.resolution, this.value, '');   
        });  
        
        // Subscope  has changed, update the state
        var _subscopeChanged = Azavea.tryCatch('subscope resolution change', function() {
            // Announce our state change
            _updateState(_state.resolution, _state.scope, this.value);             
        });  

        // Listen for the indicator changed event to fire, which tells this widget to become active
        var _indicatorChanged = Azavea.tryCatch('resolution indicator change', function(event, ind) {
            
            // Check that we have an actual indicator Id. 
            if (ind.AvailableYearsByResolution){
                // Get an array of the UIDs of the available resolutions for this indicator.
                var resolutions = [];
                $.each(ind.AvailableYearsByResolution, function (uid) {
                    resolutions.push(parseInt(uid, 10));
                });
                // Display resolution, ensure other controls must start over
                _renderSelectOptions('Select Geography Level', _curMetadata.Resolutions, '#pdp-nyc-resolution', 'UID', resolutions);
                
                _$scope.hide();
                _$subScope.hide();              
                _$resolution
                    .attr('selectedIndex', 0)
                    .removeAttr('disabled');                
            } else {
                _resetInputs();
            }
            
            // No resolution picked.
            _updateState('', '', '');
        });  

        // Bind to events that this widget cares about                                
        var _bindEvents = Azavea.tryCatch('bind nychanis resolution events', function() {
            
            // Listen for Indicator
            $(_options.bindTo).bind('pdp-nychanis-indicator-change', _indicatorChanged);
            
            // Listen for a reset command
            $(_options.bindTo).bind('pdp-criteria-reset', _resetInputs);
            
            // Setup Category dropdown
            _$resolution
                .attr('disabled', true)
                .change(_resolutionChanged);
            
            // Sub Cat
            $('#pdp-nyc-scope')
                .change(_scopeChanged)
                .parent();
                
            // Indicator
            $('#pdp-nyc-subscope')
                .change(_subscopeChanged)
                .parent();
                
        });

        // Render the basic markup that this widget uses   
        var _render = Azavea.tryCatch('render nychanis resolution', function() {
            $('<div id="pdp-nyc-resolution-container" class="pdp-nyc-control"><select id="pdp-nyc-resolution"><option val="">-- Select --</option></select><span id="pdp-nyc-help-res" title="You must choose a geographic level to calculate your indicator.  All indicators have data for the whole city and borough.  Community districts, police precincts, school districts, subborough areas and census tracts may be available as well." class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span></div>' + 
              '<div id="pdp-nyc-scope-container" class="pdp-nyc-control"><label for"pdp-nyc-scope">But only those in</label><select id="pdp-nyc-scope"></select><span id="pdp-nyc-help-scope" title="You may choose to limit the neighborhoods on the map or table to a single borough." class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span></div>' + 
              '<div id="pdp-nyc-subscope-container" class="pdp-nyc-control"><select id="pdp-nyc-subscope"></select><span id="pdp-nyc-help-subscope" title="You may choose to limit the census tracts displayed on the map or table to a single sub-borough area." class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span></div>'
            ).appendTo(_options.target);
        });

         // Initialize the widget  
        _self.init = Azavea.tryCatch('init nychanis resolution', function() {
            $(_options.bindTo).bind('pdp-nychanis-attributes', function(event, meta) {
                _curMetadata = meta;
                _render();
                
                _$resolution = $('#pdp-nyc-resolution');
                _$scope = $('#pdp-nyc-scope-container').hide();
                _$subScope = $('#pdp-nyc-subscope-container').hide();
                                
                _bindEvents();
                
                // Get the list of resolutions by id so we can do lookups, cache the id of borough and subborough
                $.each(meta.Resolutions, function(i, res) {
                    if (res.Name === 'Borough'){
                        _boroughUID = res.UID;
                    }
                    else if(res.Name === 'Subborough Area'){
                        _subBoroughUID = res.UID;
                    }
                    _resolutionsById[res.UID] = res;
                    _resolutionsById[res.UID].GeogsByActualId = {};
                    $.each(res.Geographies, function(g, geog) {
                        _resolutionsById[res.UID].GeogsByActualId[geog.ActualId] = geog;
                    });
                                    
                });
            });
            return _self;
        });
        
        return _self;
    };
}(PDP));