(function(P) {
    P.Widget.NychanisTime = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Nychanis
            }, options),
            _state = {
                type: '',
                typeName: '',
                minYear: '',
                maxYear: ''
            }, 
            _fields= [
                { id:'pdp-nyc-result-min', required:false, validator: 'number' },
                { id:'pdp-nyc-result-max', required:false, validator: 'number' }
            ],
            _curIndicator = {},
            _curTimeResponse = {},
            _timeTypeInputsById = {},
            _$range ={},
            _$details = {},
            _$minYear,
            _$maxYear,
            _$timeSelector = {},
            _$timeTypes = {},
            _availableYears,
            _resId;
            
        
        //Helper to determine if a year is in a gap
        var _isGapYear = Azavea.tryCatch('is year in gap', function(year) {
            var i;
            for(i=0; i<_availableYears.length; i++) {
                if (year === _availableYears[i]) {
                    return false;
                }
            }
            
            return true;
        });
        
        //Function to change the min/max year input value and do a smart highlight 
        var _changeYearInputVal = Azavea.tryCatch('change year input', function($input, val) {
            $input.val(val);
            
            var timeoutId = $input.data('highlightTimeout');
            //Clear the last timeout, if applicable, then set a new one
            if (timeoutId) {
                clearTimeout(timeoutId);
            } else {
                //Highlight the input
                $input.effect('highlight', {}, 1000);
            }
            
            //Set a new timeout
            timeoutId = setTimeout(function() {
                $input.data('highlightTimeout', null);
            }, 500);
            //Set the latest timeout id
            $input.data('highlightTimeout', timeoutId);
        });
        
        var _updateYearControls = Azavea.tryCatch('update year controls', function(curResTimeType){
            //Helper to search the years array to see if this year is in the list
            function isInList(year, yearsArray) {
                var j;
                for (j=0; j<yearsArray.length; j++) {
                    if (year === yearsArray[j]) {
                        return true;
                    }
                }
                return false;
            }
            
            //Array to track the year gaps
            _availableYears = [];
            var year,
                min = curResTimeType[0],
                max = curResTimeType[curResTimeType.length -1],
                range = max - min;

            for(year=min; year<=max; year++) {
                if (isInList(year, curResTimeType)) {
                    //Is this year missing from list of years?
                    _availableYears.push(year);
                } else {
                    _availableYears.push(null);
                }
            }
            
            P.Util.renderers.sliderTicks(_$range, _availableYears);
            
            //Set the min/max inputs
            _$minYear.val(min);
            _$maxYear.val(max);
            
            //Set the slider range and handles
            _$range.slider('option', 'min', min);
            _$range.slider('option', 'max', max);
            _$range.slider('option', 'values', [min, max]);
        });
        
        // Trigger the event which lets everyone know we are valid
        var _triggerChange = Azavea.tryCatch('trigger time change', function() {
            $(_options.bindTo).trigger('pdp-nychanis-time-change', [ _state ]);
        });

       //  Update our current state and trigger our event
       var _updateState = Azavea.tryCatch('nyc time update state', function(type, min, max) {
            _state.type = type;
            _state.typeName = type || type === 0 ? _curTimeResponse[type].Name : '';
            _state.minYear = min;
            _state.maxYear = max;  

            // Tell whomever about our current state
            _triggerChange();     
        });
        
        // Listen for event to clear our form fields
        var _resetInputs = Azavea.tryCatch('reset resolution inputs', function() {
            // Clear the state
            _updateState('', '','');
            
            // Clear and disable form elements
            _$timeSelector.attr('disabled', true).val(''); 
            _$timeType.button('option', 'disabled', true);
            _$range.slider('option', 'disabled', true);
            $('.pdp-nychanis-disabled-gap', _$range).remove();
            _$minYear.val('');
            _$maxYear.val('');            
        });

        // Listen for an event giving us the current indicator, which has values restricting our data
        var _indicatorChanged = Azavea.tryCatch('indicator changed', function(event, ind) {
            
            // Everything is disabled if the indicator changed
            _resetInputs();
            
            // Check that we have an actual indicator.
            if (ind.Name){
                _curIndicator = ind;
            }else{
                _curIndicator = {}; 
            }
        });  

        // Listen for an event that the resolution has been selected, in which case this widget is activated
        var _resolutionChanged = Azavea.tryCatch('resolution changed', function(event, res) {
            var firstTimeType;
            var min, 
                max;
            // The time types are attached to the indicator object, and it contains a list of years available
            // Set up the
            if(res.resolution || res.resolution === 0){
                var sel ='',
                    type,
                    curResTimeType;
                // Initialize our firstTimeType
                firstTimeType = -1;
                                    
                // Parse our ID the way we'd like it
                _resId = parseInt(res.resolution, 10);
                
                // When we have a resolution, we become activated
                _$timeSelector.removeAttr('disabled'); 
                               
                // Activate valid time types
                _$timeType.button('option', 'disabled', true);
                
                // For each time type we have, enable that button 
                for (type in _curIndicator.AvailableYearsByResolution[_resId]){
                
                    if (type && _curIndicator.AvailableYearsByResolution[_resId].hasOwnProperty(type) ){
                        if (firstTimeType === -1){
                            firstTimeType = parseInt(type, 10);
                        }
                        sel = _timeTypeInputsById[parseInt(type, 10)];
                        
                        // Enable this time type button
                        $(sel).button( 'option', 'disabled', false);
                    }
                }
                
                // Check the first available button
                if (firstTimeType > -1){
                    $(_timeTypeInputsById[firstTimeType]).attr('checked', 'checked');
                    $(_timeTypeInputsById[firstTimeType]).button('refresh');
                }
                
                // Set up the slider and min/max search fields which will be the first and last items in the
                //  list of the available years for the selected resolution time frame
                curResTimeType = _curIndicator.AvailableYearsByResolution[_resId][firstTimeType];
                min = curResTimeType[0];
                max = curResTimeType[curResTimeType.length -1];

                _updateYearControls(curResTimeType);
                                
                // Enable the slider
                _$range.slider('option', 'disabled', false);
            } else {
                _$timeSelector.attr('disabled', true); 
                _$timeType.button('option', 'disabled', true);
                _$range.slider('option', 'disabled', true);
                $('.pdp-nychanis-disabled-gap', _$range).remove();
            }
            
            // Update our state
            _updateState(firstTimeType, min, max);
        });
             
        // The min value has been changed, update the slider and the state                                
        var _minChanged = Azavea.tryCatch('min time value changed', function() {
            // Our valid value, or an empty string
            var minYear = _availableYears[0],
                maxYear = _availableYears[_availableYears.length - 1],
                val = minYear, 
                input = parseInt(this.value, 10);
            
            if (P.Form.validate(_fields, {}, _options.target) && 
               (val >= minYear && val <= maxYear)){
                // In the range, but is it under the current max?
                if (val <= _$maxYear.val() && !_isGapYear(input)){
                    // The value is valid
                    val = input;
                }    
                else {
                    // Show we're changing their typed value, clear any previous animations
                    _changeYearInputVal(_$minYear, minYear);
                }
            } else {
                // Show we're changing their typed value, clear any previous animations
                _changeYearInputVal(_$minYear, val);
            }
            _updateState(_state.type, val, _state.maxYear);
            
            // Keep the slider up to date (0 = index, lower val)
            _$range.slider('values', 0, val);            
        });

        // The max value has been changed, update the slider and the state
        var _maxChanged = Azavea.tryCatch('max time value changed', function() {
            // Our valid value, or an empty stringa
            var minYear = _availableYears[0],
                maxYear = _availableYears[_availableYears.length - 1],
                val = maxYear,
                input = parseInt(this.value, 10);
                
            if (P.Form.validate(_fields, {}, _options.target) && 
                (this.value >= minYear && this.value <= maxYear)){
                // In the range, but is it over the current min?
                if (this.value >= _$minYear.val() && !_isGapYear(input)){
                    // The value is valid
                    val = input;
                }    
                else {
                    // Show we're changing their data, and reset to max
                    _changeYearInputVal(_$maxYear, maxYear);
                }
            } else {
                _changeYearInputVal(_$maxYear, val);
            }
              
            _updateState(_state.type, _state.minYear, val);  
            
            // Keep the slider up to date (1 = index, upper val)
            _$range.slider('values', 1, val);         
        });

        // Slider value has changed
        var _slideChanged = Azavea.tryCatch('slide changed', function(min, max) {
            
            if (min !== parseInt(_$minYear.val(), 10)){
                _changeYearInputVal(_$minYear, min);
            }
            if (max !== parseInt(_$maxYear.val(), 10)){
                _changeYearInputVal(_$maxYear, max);
            }
            _updateState(_state.type, min, max);
        });
        
        // Result time type has changed, update state
        var _detailsChanged = Azavea.tryCatch('detail time value changed', function() {
            var curResTimeType,
                type = $('input[name="pdp-nyc-search-result-details"]:checked').val();
                
                
            // A new time type means new min and max years
            curResTimeType = _curIndicator.AvailableYearsByResolution[_resId][type];

            // Update the controls and our state
            _updateYearControls(curResTimeType);
                        
            _updateState(type, _state.minYear, _state.maxYear);
        });
              
        // Bind to events this widget cares about                
        var _bindEvents = Azavea.tryCatch('bind nychanis time events', function() {
            // Listen for Indicator
            $(_options.bindTo).bind('pdp-nychanis-indicator-change', _indicatorChanged);

            // Listen for Resolution
            $(_options.bindTo).bind('pdp-nychanis-resolution-change', _resolutionChanged);
            
            // Listen for reset
            $(_options.bindTo).bind('pdp-criteria-reset', _resetInputs);
            
            // Setup the form fields
            _$minYear.change(_minChanged);
            _$maxYear.change(_maxChanged);
            _$details.change(_detailsChanged);
        });
            
        // Render the markup this widget uses and set it to a default state    
        var _render = Azavea.tryCatch('render nychanis time', function(data) {
           // Build the time units as radio buttons, and build a lookup for the inputs
            var timeInputs = '',
                date = new Date();
            
            // Cache so we can look up the names later    
            _curTimeResponse = data.Times;
                
            $.each(data.Times, function(i, time){
                timeInputs += '<input id="pdp-nyc-result-type-' + time.Name + '" value="' + time.UID + '" name="pdp-nyc-search-result-details" class="pdp-nyc-time-type" type="radio"/>'  + 
                                    '<label for="pdp-nyc-result-type-' + time.Name + '">' + time.Name + 's</label>';
                _timeTypeInputsById[time.UID] = '#pdp-nyc-result-type-' + time.Name;
            });
            
            $('<div id="pdp-nyc-search-result-details" class="pdp-nyc-control">' + 
                    timeInputs + 
                '</div>' + 
                '<div class="pdp-nyc-year-container pdp-nyc-control"><label>From</label> <input id="pdp-nyc-result-min" class="pdp-nyc-results-time-selector" type="text" size="10" value="'+_state.minYear+'"/><label> to </label>' + 
                '<input id="pdp-nyc-result-max" class="pdp-nyc-results-time-selector" type="text" size="10" value="'+_state.maxYear+'"/></div>' + 
                '<div id="pdp-nyc-result-year-slider" class="pdp-nyc-control"></div><span id="pdp-nyc-help-slider" title="This slider lets you limit which years, quarters or months will appear in the table.  You may select a different year to map on the selector above the map legend." class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span>')
                .appendTo(_options.target);
            
            // Local cache of these common lookups
            _$range = $('#pdp-nyc-result-year-slider');  
            _$details = $('#pdp-nyc-search-result-details');
            _$minYear = $('#pdp-nyc-result-min');
            _$maxYear = $('#pdp-nyc-result-max');
            _$timeSelector = $('.pdp-nyc-results-time-selector');
            _$timeType = $('.pdp-nyc-time-type');
             
            // Enable the tooltips
            $('.pdp-nyc-control-label-help').tooltip({
                tipClass: 'pdp-pdb-control-tooltip',
                // place tooltip on the right edge
                position: 'center right',
                // a little tweaking of the position
                offset: [-2, 10],
                // use the built-in fadeIn/fadeOut effect
                effect: "fade"
            }); 
                         
            // Setup the form UI elements
            _$details.buttonset();
            _$range.slider({
		        range: true,
		        animate: true,
		        min: 1975,
		        max: date.getFullYear(),
		        values: [1975, date.getFullYear()],
		        slide: function(event, ui) {
			        if (_isGapYear(ui.values[0]) || _isGapYear(ui.values[1])) {
			            return false;
			        } else {
                        _slideChanged(ui.values[0], ui.values[1]);
                    }
                }
	        });
	        
	        // Disable by default
	        _$timeSelector.attr('disabled', true); 
	        _$details.button('option', 'disabled', true);
	        _$timeType.button('option', 'disabled', true);
	        _$range.slider('option', 'disabled', true);
        });
            
        // Initialize the widget    
        _self.init = Azavea.tryCatch('init nychanis time', function() {
            $(_options.bindTo).bind('pdp-nychanis-attributes', function(event, meta) {
                _render(meta);
                
                
                _bindEvents();
            });
            return _self;
        });
        return _self;
    };
}(PDP));