(function(P) {
    P.Widget.PdbAggregations = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Pdb
            }, options),
            _groupBys = [],
            _groupBysDesc = [],
            _$countsPanel;

        //Update the context list (under the button) of selected group by columns
        var _setGroupByList = Azavea.tryCatch('update group by list', function($target) {
            _groupBys = [];
            _groupBysDesc = [];
            $('input:checked', '#pdp-pdb-search-counts-panel-cols').each(function(i, el) {
                _groupBys.push($(el).attr('id'));
                _groupBysDesc.push(el.value);
            });
        });
        
        var _focusDetails = Azavea.tryCatch('focus details', function() {
            $('#pdp-pdb-search-counts').slideUp();
            _$countsPanel.hide();
            
            // Take away the group by criteria, so we can search by details
            $(_options.bindTo).trigger('pdp-pdb-aggregations-change', [[], false]);
            
            // Enable the search button, search at anytime for property details
            $('#pdp-pdb-button-search').button('enable');
        });
        
        var _focusCounts = Azavea.tryCatch('focus counts', function() {
            var $statusMsg = $('#pdp-pdb-search-counts');
            if (!$statusMsg.is(':visible')) {
                $statusMsg.slideDown();
            }
            
            //Show counts panel
            if (_$countsPanel.is(':visible')) {
                _$countsPanel.hide();
            } else {
                _$countsPanel.show();
            }
                               
            // Bring back the possible groupbys selected before a search by details
            $(_options.bindTo).trigger('pdp-pdb-aggregations-change', [ _groupBys, true ]);
        });
        
        var _bindEvents = Azavea.tryCatch('bind pdb aggregation events', function(){
            // Show the counts panel
            $(_options.bindTo).bind('pdp-show-counts-panel', function(event) {
                $('label[for="pdp-pdb-search-result-counts"]').click();
                _$countsPanel.show();
            });
            
            //Reset the criteria
            $(_options.bindTo).bind('pdp-criteria-reset', function(event) {
                $('input:checked', '#pdp-pdb-search-counts-panel-cols')
                    .attr('checked', '')
                    .removeAttr('disabled')
                    .change();
            });
            
            //Turn the radio buttons into a buttonset
            $('#pdp-pdb-search-result-type').buttonset();
            
            //Toggle list view vs aggregation view
            $('label[for="pdp-pdb-search-result-details"]')
                .click(_focusDetails);
            
            //Show the group by panel when counts is selected
            $('label[for="pdp-pdb-search-result-counts"]')
                .click(_focusCounts);

            //Show the panel when the "change" link is clicked
            $('#pdp-pdb-search-counts-change').click(function(){
                if (!_$countsPanel.is(':visible')) {
                    _$countsPanel.show();
                } else {
                    _$countsPanel.hide();
                }
            });
            
            //Close the panel when the X is clicked
            $('#pdp-pdb-search-counts-panel-close').click(function(event) {
                _$countsPanel.hide();
            });
            
            //These windows are weird so we're handing the mutual exclusivity manually
            $(document).bind('mouseup', function(event){
                if (!$(event.target).is('#pdp-pdb-search-counts-change') && 
                    $(event.target).closest('#pdp-pdb-search-counts-panel').length === 0) {
                    _$countsPanel.hide();
                }
            });
            
            //Update everything when a checkbox is checked
            $('input', '#pdp-pdb-search-counts-panel-cols').change(function(event) {
                _setGroupByList();
                
                $(_options.bindTo).trigger('pdp-pdb-aggregations-change', [ _groupBys, true ]);
                
                var $groupByList = $('#pdp-pdb-search-counts-cols > strong');
                if (_groupBys.length) {
                    $groupByList.text(_groupBysDesc.join(', '));
                } else {
                    $groupByList.text('none selected');
                }
                
                if (_groupBys.length >= 3) {
                    $('input:not(:checked)', '#pdp-pdb-search-counts-panel-cols').attr('disabled', 'disabled');
                } else {
                    $('input:not(:checked)', '#pdp-pdb-search-counts-panel-cols').removeAttr('disabled');
                }
            });
        });

        //Render the buttons and the panel
        var _render = Azavea.tryCatch('render pdb counts panel', function(data) {
            var _renderCountsAttrs = Azavea.tryCatch('render pdb counts attrs', function(data, $target) {
                $.each(data, function(i, obj) {
                    if (obj.Attrs) {
                        //This is a cat description
                        var $cat = $('<li rel="' + obj.Order + '"><div class="pdb-pdb-search-counts-category"><label class="pdb-pdb-search-counts-category-label">'+obj.Name+'</label></div>' + 
                            '<ul class="pdp-pdb-search-counts-category"></ul></li>');//.appendTo($target);
                        var prevNumber = parseInt(obj.Order, 10) - 1;
                        var $previousOrderedElement = $target.children('li[rel="' + prevNumber.toString() + '"]');
                        if ($previousOrderedElement.length){
                            // Insert this on the DOM after the found element
                            $cat.insertAfter($previousOrderedElement);                         
                        } else {
                             // Nothing to order with, just append to the end
                            $cat.appendTo($target);  
                        }
                        
                        // Render top level controls
                        _renderCountsAttrs(obj.Attrs, $cat.children('ul.pdp-pdb-search-counts-category'));
                        
                        // Render sub cats
                        if (obj.SubCats && obj.SubCats.length) {
                            _renderCountsAttrs(obj.SubCats, $('ul.pdp-pdb-search-counts-category', $cat));
                        }                        
                    } else {
                        // This is a criteria attribute
                        if (obj.CanGroup) {
                            // Test out renderer
                            $('<li rel="' + obj.CategoryOrder + '"><input type="checkbox" id="'+obj.UID+'" value="' + obj.Name + '"/><label for="'+obj.UID+'" class="pdp-pdb-column-label">'+obj.QueryName+'</label></li>').appendTo($target);
                        }
                    }    
                });
            });
            
            $('<div id="pdp-pdb-search-result-type">'+
                '<input type="radio" id="pdp-pdb-search-result-details" name="pdp-pdb-search-result-type" checked="checked" /><label for="pdp-pdb-search-result-details">Details</label>' + 
		        '<input type="radio" id="pdp-pdb-search-result-counts" name="pdp-pdb-search-result-type" /><label for="pdp-pdb-search-result-counts">Counts</label>' + 
            '</div>' + 
            '<div id="pdp-pdb-search-counts">' +
                '<div id="pdp-pdb-search-counts-cols">Count data by (<strong>none selected</strong>)</div>' +
                '<a id="pdp-pdb-search-counts-change" href="javascript:void(0);">(change)</a>' +
            '</div>' +
            '<div id="pdp-pdb-search-counts-container" class="pdp-shadow-drop ui-corner-all">' +
                '<div id="pdp-pdb-search-counts-panel">' + 
                    '<div id="pdp-pdb-search-counts-panel-content">' +
                        '<div id="pdp-pdb-search-counts-panel-close"><span class="ui-icon ui-icon-circle-close"></span></div>' +
                        '<p id="pdp-pdb-search-counts-caption" class="ui-corner-all ui-widget-content">Choose 1, 2 or 3 characteristics to group your filtered property results.</p>' + 
                        '<ul id="pdp-pdb-search-counts-panel-cols"></ul>' + 
                    '</div>' + 
                '</div>' +
            '</div>').appendTo(_options.target);
            
            _renderCountsAttrs(data, $('#pdp-pdb-search-counts-panel-cols'));
            
            //Remove empty categories
            $('ul.pdp-pdb-search-counts-category:empty').parent().remove();
            
            _$countsPanel = $('#pdp-pdb-search-counts-container');
        });

        _self.init = Azavea.tryCatch('init pdb aggregations', function() {
            $(_options.bindTo).bind('pdp-pdb-attributes', function(event, attrResp) {
                _render(attrResp.List);
                _bindEvents();
            });
        
            return _self;
        });
        
        return _self;
    };
}(PDP));