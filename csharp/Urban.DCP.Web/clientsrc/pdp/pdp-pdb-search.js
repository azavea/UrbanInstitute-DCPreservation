(function(P) {
    P.Pdb.Search = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Pdb
            }, options),
            _criteria,
            _aggregations;

        //Render placeholders to the target
        var _render = Azavea.tryCatch('render pdb search', function() {
            $('<div id="pdp-pdb-search-criteria" class="pdp-pdb-search-container"><h4>Filter by</h4></div>' + 
            '<div id="pdp-pdb-search-aggregations" class="pdp-pdb-search-container"><h4>Show my results as</h4></div>' + 
            '<div class="pdp-search-actions"><button id="pdp-pdb-button-search" class="pdp-button">Submit</button>' + 
            '<a id="pdp-pdb-button-reset" href="javascript:void(0);">Clear</a></div>').appendTo(_options.target);
            
            $('#pdp-pdb-button-search').button();
        });
               
        var _bindEvents = Azavea.tryCatch('bind pdb search events', function(){
            //Force everyone update!
            $('#pdp-pdb-button-search').click(function(){
                $(_options.bindTo).trigger('pdp-data-force-update');
            });
            
            //Clear the criteria and results
            $('#pdp-pdb-button-reset').click(function(){
                $(_options.bindTo).trigger('pdp-criteria-reset');
            });
        });

        _self.init = Azavea.tryCatch('init pdb search', function() {
            _render();
            _bindEvents();
            
            //Init the criteria widget.
            _criteria = P.Widget.PdbCriteria({
                target: '#pdp-pdb-search-criteria'
            }).init(_self);
            
            //Init the aggregations widget.
            _aggregations = P.Widget.PdbAggregations({
                target: '#pdp-pdb-search-aggregations'
            }).init(_self);
   
            //Get the PDB metadata and push it out
            P.Data.getAttributes(function (attrResp) {
                $(_options.bindTo).trigger('pdp-pdb-attributes', [ attrResp ]);
            });

            return _self;
        });
        
        return _self;
    };
}(PDP));