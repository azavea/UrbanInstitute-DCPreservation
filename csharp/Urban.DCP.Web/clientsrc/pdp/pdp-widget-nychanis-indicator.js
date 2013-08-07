(function(P) {
    P.Widget.NychanisIndicator = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Nychanis
            }, options),
            _state = {},
            _curMetadata={},
            _indicatorsById ={},
            $indicator ={},
            $category ={},
            $subCategory ={},
            $indicatorTip,
            $indContainer,
            $subContainer,
            $catContainer;

        // Trigger the event for this widget's state
        var _triggerChange = Azavea.tryCatch('trigger indicator change', function() {
            $(_options.bindTo).trigger('pdp-nychanis-indicator-change', [ _state ]);
        });

        // Update the current state object, trigger the event
        var _updateState = Azavea.tryCatch('trigger indicator change', function(indicator) {

            // Make the indicator object available, it has resolution and time types on it
            if (indicator || indicator === 0){
                _state = _indicatorsById[indicator];
                // Show the ? image specific to this indicator
                if ($indicatorTip){
                    $indicatorTip.remove();
                }
                
                // Hide the default tooltip
                $indicatorDefaultTip.hide();
                
                $indicatorTip = $('<span id="pdp-nyc-indicator-help" class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span>').appendTo($indContainer);
                
                // Set up the tooltip component.  You need to do it this way because the tooltip widget
                // will cache the title, even if you update the title of the element later.  You need to 
                // recreate the entire span element each time it changes.
                $indicatorTip
                    .attr('title', _state.Description)
                    .tooltip({
                        tipClass: 'pdp-pdb-control-tooltip',
                        
                        // place tooltip on the right edge
                        position: 'center right',

                        // a little tweaking of the position
                        offset: [-2, 10],

                        // use the built-in fadeIn/fadeOut effect
                        effect: "fade"
                    });
            } else {
                if ($indicatorTip) {
                    $indicatorTip.remove();
                }
                
                // Show the default tooltip
                $indicatorDefaultTip.show();
                
                _state = {};
            }
            
            // Tell whomever about our current state
            _triggerChange();     
        });
        
        // Generic method for populating indicator select options
        var _renderSelectOptions = Azavea.tryCatch('create select options', function(title, items, target, valueProperty){
            var indOptions = '<option id="" value="" selected=selected>- - ' + title + '- -</option>',
                $target;
            
            $.each(items, function(i, item){
                var val = valueProperty ? item[valueProperty] : i;
                indOptions += '<option value="' + val + '" title="' + item.Name + '">' + item.Name + '</option>';
            });
            
            $target = $(target);
            
            // A bug in IE prevents new options from being loaded, clear them from the screen manually.
            $target[0].options.length = 0;
            
            // Empty and add the new options
            $target.empty().append(indOptions);
        });
        
        // Indicator Category has changed, update UI and State
        var _indCatChanged = Azavea.tryCatch('indicator category changed', function() {
            
            if (this.value || this.value === 0){
                // Create our subcategory dropdown, make sure indicator is still hidden
                _renderSelectOptions('Subcategory', _curMetadata.IndCats[this.value].SubCats, '#pdp-nyc-indicator-sub-category');
                $subContainer.show();
                $indicator.empty();
                $indContainer.hide();
            }else{
                // Default category, hide the sub and ind
                $subContainer.hide();
                $indicator.empty();
                $indContainer.hide();      
            }
            _updateState($indicator.val());            
        });

        // Indicator SubCategory has changed, update UI and State
        var _indSubCatChanged = Azavea.tryCatch('indicator sub category changed', function() {
            if (this.value || this.value === 0){
                // Create our indicator dropdown, make sure indicator is still hidden
                var cat = $category.val(),
                    subCat = this.value;
                
                _renderSelectOptions('Must Choose an Indicator', _curMetadata.IndCats[cat].SubCats[subCat].Indicators, '#pdp-nyc-indicator', "UID");
                $indContainer.show();
            }else{
                // Default category, hide the ind
                $indicator.empty();
                $indContainer.hide();            
            }     
                            
            _updateState($indicator.val());
        });
        
        // Indicator has changed, update state
        var _indChanged = Azavea.tryCatch('indicator changed', function() {
            // We have our indicator
            _updateState(this.value);           
        });
        
        // Reset widget to default state
        var _resetIndicators = Azavea.tryCatch('reset indicator values', function(){
            
            // Hide Sub Cat and indicator
            if ($subCategory) {
                $subContainer.hide();
                $subCategory.empty();
            }
            if ($indicator) {
                $indicator.empty();
                $indContainer.hide();
            }
                        
            // Select default category
            $category.attr('selectedIndex', 0);

            // Make sure state is blanked out
            _state = {};
        });
        
        // Bind to events that this widget cares about
        var _bindEvents = Azavea.tryCatch('bind nychanis indicator events', function() {
            // Setup Category dropdown
            $category.change(_indCatChanged);
            
            // Sub Cat
            $subCategory.change(_indSubCatChanged);
            
            // Indicator
            $indicator.change(_indChanged);
            
            $(_options.bindTo).bind('pdp-criteria-reset', _resetIndicators);
        });
               
        // Render the basic markup that this widget uses                        
        var _render = Azavea.tryCatch('render nychanis indicator', function() {
            $('<div id="pdp-nyc-container-cat" class="pdp-nyc-indicator-selector pdp-nyc-control"><select id="pdp-nyc-indicator-category"></select><span id="pdp-nyc-help-ind-cat" title="Indicators are grouped into categories. You must select one." class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span></div>' + 
                    '<div id="pdp-nyc-container-sub" class="pdp-nyc-indicator-selector pdp-nyc-control"><select id="pdp-nyc-indicator-sub-category"></select><span id="pdp-nyc-help-ind-sub" title="Categories are divided into subcategories.  You must select one." class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span></div>' + 
                    '<div id="pdp-nyc-container-ind" class="pdp-nyc-indicator-selector pdp-nyc-control"><select id="pdp-nyc-indicator"></select><span id="pdp-nyc-help-ind" title="You must choose an individual indicator to display on the map or table." class="ui-icon ui-icon-help pdp-nyc-control-label-help"></span></div>').appendTo(_options.target);
            
            // Render the categories immediately
            _renderSelectOptions('Category', _curMetadata.IndCats, '#pdp-nyc-indicator-category');
                        
        });
            
        // Initialize the widget            
        _self.init = Azavea.tryCatch('init nychanis indicator', function() {
            $(_options.bindTo).bind('pdp-nychanis-attributes', function(event, meta) {
                _curMetadata = meta;
                _render();
                
                // Local cache for these common selectors
                $category = $('#pdp-nyc-indicator-category');
                $subCategory = $('#pdp-nyc-indicator-sub-category');
                $indicator = $('#pdp-nyc-indicator');
                
                $indContainer = $('#pdp-nyc-container-ind');
                $subContainer = $('#pdp-nyc-container-sub');
                $catContainer = $('#pdp-nyc-container-cat');

                // Hide the div with the  ? 
                $subContainer.hide();
                $indContainer.hide();
                
//                // Enable the tooltips
//                $('.pdp-nyc-control-label-help').tooltip({
//                    tipClass: 'pdp-pdb-control-tooltip',
//                    
//                    // place tooltip on the right edge
//                    position: 'center right',

//                    // a little tweaking of the position
//                    offset: [-2, 10],

//                    // use the built-in fadeIn/fadeOut effect
//                    effect: "fade"
//                });
                
                // The default indicator tooltip will be swapped out when an actual indicator is selected
                $indicatorDefaultTip = $('#pdp-nyc-help-ind');
                
                _bindEvents();

                // Get a lookup for each indicator, by ID
                $.each(meta.IndCats, function(i, cat) {
                    $.each(cat.SubCats, function(i, subcat) {
                        $.each(subcat.Indicators, function(i, ind) {
                            _indicatorsById[ind.UID] = ind;
                        });
                    }); 
                });
            });
            return _self;
        });
        return _self;
    };
}(PDP));