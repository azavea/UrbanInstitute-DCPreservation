(function(P) {
    P.Nychanis.Search = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Nychanis
            }, options),
            _criteria,
            _aggregations,
            _$button;

        //Render placeholders to the target
        var _render = Azavea.tryCatch('render nychanis search', function() {
            $('<div id="pdp-nychanis-search-criteria" class="pdp-nychanis-search-container">' + 
                '<h4>Indicator<span id="pdp-nyc-help-indicator" title="An indicator provides comparable information about a specific attribute of regions of New York City.  It does not affect which properties are displayed." class="ui-icon ui-icon-help pdp-nyc-filter-tooltip"></span></h4><div id="pdp-nychanis-indicator"></div>' + 
                '<h4>Geographic Boundary<span id="pdp-nyc-help-geo" title="You must choose geographic areas to calculate your indicator." class="ui-icon ui-icon-help pdp-nyc-filter-tooltip"></span></h4><div id="pdp-nychanis-resolution"></div>' + 
            '</div>' + 
            '<div id="pdp-nychanis-result-type" class="pdp-nychanis-search-container">' + 
                '<h4>Show my results in<span id="pdp-nyc-help-results" title="You must choose a time scale for your indicator. All indicators are available by year.  Depending on the indicator, there may be quarterly or monthly data. If you change nothing, the most recently selected time period will be mapped." class="ui-icon ui-icon-help pdp-nyc-filter-tooltip"></span></h4><div id="pdp-nychanis-time"></div>' + 
            '</div>' + 
            '<div class="pdp-search-actions"><button id="pdp-nychanis-button-search" class="pdp-button">Submit</button>' + 
            '<a id="pdp-nychanis-button-reset" href="javascript:void(0);">Clear</a></div>').appendTo(_options.target);
            
            _$button = $('#pdp-nychanis-button-search').button();
            
            // Enable the tooltops
            $('.pdp-nyc-filter-tooltip').tooltip({
                    tipClass: 'pdp-pdb-control-tooltip',
                    // place tooltip on the right edge
                    position: 'center right',
                    // a little tweaking of the position
                    offset: [-2, 10],
                    // use the built-in fadeIn/fadeOut effect
                    effect: "fade"
                });            
        });

        //Helper to enable/disable the nychanis search button
        var _enableSearch = Azavea.tryCatch('enable nychanis search button', function(event, data){
            if (data.resolutionName){
                _$button.button('option', 'disabled', false);
            } else {
                _$button.button('option', 'disabled', true);
            }
        });
        
        var _bindEvents = Azavea.tryCatch('bind nychanis search events', function(){
            //Someone clicked the search button
            $('#pdp-nychanis-button-search').click(function(){
                $(_options.bindTo).trigger('pdp-data-force-update');
            });
            
            //Someone clicked the reset button
            $('#pdp-nychanis-button-reset').click(function(){
                $(_options.bindTo).trigger('pdp-criteria-reset');
            });
            
            //Enable/disable the search button based on the resolution since
            //a search is only possible once a resolution is selected.
            $(_options.bindTo).bind('pdp-nychanis-resolution-change' , _enableSearch);
        });

        _self.init = Azavea.tryCatch('init nychanis search', function() {
            _render();
            _bindEvents();
        
            // Cannot search on init
            _$button.button('option', 'disabled', true);
        
            //Widget to select an indicator via category and subcategory
            P.Widget.NychanisIndicator({
                target: '#pdp-nychanis-indicator'
            }).init();
            
            //Widget to select a resolution with scope and subscope (basically
            //geographic filters of the resolution). Dependent on the indicator selected.
            P.Widget.NychanisResolution({
                target: '#pdp-nychanis-resolution'
            }).init();
            
            //Widget to select the "time" (years, quarters, months). Can 
            //be filtered by year (all quarters between 2006 and 2010).
            P.Widget.NychanisTime({
                target: '#pdp-nychanis-time'
            }).init();
            
            //Get the Nychanis metadata to populate the values of the
            //above widgets.
            P.Data.getNychanisMeta(function (attrResp) {
                $(_options.bindTo).trigger('pdp-nychanis-attributes', [ attrResp ]);
            });
            
            return _self;
        });
        
        return _self;
    };
}(PDP));