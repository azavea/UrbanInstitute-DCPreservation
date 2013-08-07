(function(P) {
    P.Widget.ColumnSelector = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P
            }, options),
            _eventObj = P,
            _curTableAttrs = {},
            _colVisCache = {},
            _$button;
        
        // Trigger the event for column visibility
        var _triggerVisibilityEvent = Azavea.tryCatch('trigger visibility event', function(idx){
                var cols = _getColVisibilityArray();
                $(_options.bindTo).trigger('pdb-column-visibility', [cols, idx]);                        
        });
        
        // Takes a structured Attrs list and makes a panel out of it
        var _renderAttributePanel = Azavea.tryCatch('render select columns panel', function(data) {
            var _renderAttrs = Azavea.tryCatch('render pdb counts attrs', function(data, $target) {
                $.each(data, function(i, obj) {
                    if (obj.Attrs) {
                        //This is a cat description
                        var $cat = $('<li rel="' + obj.Order + '"><div class="pdb-column-select-category"><label class="pdb-column-select-category-label">'+obj.Name+'</label></div>' + 
                            '<ul class="pdp-column-select-category"></ul></li>').appendTo($target);

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
                        _renderAttrs(obj.Attrs, $cat.children('ul.pdp-column-select-category'));
                        
                        // Render sub cats
                        if (obj.SubCats && obj.SubCats.length) {
                            _renderAttrs(obj.SubCats, $('ul.pdp-column-select-category', $cat));
                        }
                        
                    } else {
                        // Handle the attributes, if there is no Category or Name, we don't want the choice
                        if(obj.Category && obj.Name){
                            // This is a criteria attribute
                            $('<li rel="' + obj.CategoryOrder + '"><input type="checkbox" id="col-sel-'+obj.UID+'" /><label for="col-sel-'+obj.UID+'" class="pdp-pdb-column-label">'+obj.QueryName+'</label></li>').appendTo($target);
                        }
                    }    
                });
            });
            
            $('<div id="pdp-column-select-panel" class="pdp-closable-panel pdp-shadow-drop">' + 
                '<div id="pdp-column-select-panel-content">' + 
                    '<a id="pdp-col-select-all" class="pdp-link" href="javascript:void(0);">Select All</a><a id="pdp-col-select-none" class="pdp-link" href="javascript:void(0);">Select None</a>' + 
                    '<div id="pdp-column-select-panel-close"><span class="ui-icon ui-icon-circle-close"></span></div>' +
                    '<ul id="pdp-column-select-panel-cols"></ul>' + 
                '</div>' + 
            '</div>').appendTo(_options.target).hide();
            
            _renderAttrs(data, $('#pdp-column-select-panel-cols'));
            
            //Remove empty categories
            $('ul.pdp-column-category:empty').parent().remove();
        });
        
        // Show/hide the column list panel
        var _showColumnList = Azavea.tryCatch('show column list', function(attrResp) {
            var $panel = $('#pdp-column-select-panel');
            
            // Display panel
            $panel.toggle();
            
            // Toggle the button state
            $(this).toggleClass('pdp-column-selector-active');

            if (!$panel.attr('visible')){
                
                // Set the checkbox for those who's columns are currently not/displayed
                $.each(_colVisCache, function(i, col) {
                    $('#col-sel-' + col.UID, $panel).attr('checked', col.visible);
                });            
            }
        });
        
        // Set all columns visibility to the value supplied
        var _setAllColumnVisibility = Azavea.tryCatch('set all column visibility', function(val, $panel){
             // Check/uncheck the actual inputs
            $('input:checkbox', $panel).attr('checked', val);
                                            
            // Update cache values
            $.each(_colVisCache, function(i, col){
                col.visible = val;
            });
            
            // Trigger event
            _triggerVisibilityEvent();
        });
        
        // Compute the index of the id in our cache
        var _getColumnIndex = Azavea.tryCatch('get column index', function(id){
            var i, idx = -1;
            // Loop through our cache and count the index value until we found our id
            for (i in _colVisCache){
                if (_colVisCache.hasOwnProperty(i, false)){
                    idx++;
                    if (i === id){
                        return idx;
                    }
                }
            }
            return false;
        });
               
        // Show the list of colums
        var _createColumnPanel = Azavea.tryCatch('create column panel', function(event, attrResp) {
            var $panel = {};

            // Remove any panel that's currently there
            $(_options.target).empty();
            
            // Create the button, and give it something to do onclick
            _$button = $('<button class="pdp-column-selector pdp-closable-panel-button">Choose Columns</button>');
            _$button
                .click(_showColumnList)
                .hide()
                .button();
            
            // Add it to the page
            $(_options.target).append(_$button);
            
            // Render our panel to the screen
            _renderAttributePanel(attrResp.List);                

            $panel = $('#pdp-column-select-panel');
            
            // Close the panel on clicking the X
            $('#pdp-column-select-panel-close').click(function(event){
                $panel.hide();
            });
            
            // Select all + none
            $('#pdp-col-select-all').click(function(event){
                _setAllColumnVisibility(true, $panel);
            });
            $('#pdp-col-select-none').click(function(event){
                _setAllColumnVisibility(false, $panel);
            });
                        
            // Raise a trigger when the columns checkboxs are changed
            $('input:checkbox', $panel).change(function(event){
                
                // Update my cache status
                _colVisCache[this.id].visible = $(this).attr('checked');
                
                // Trigger an event to alert anyone who wants to know the latest cache
                //  and the individual column index that was changed
                
                _triggerVisibilityEvent(_getColumnIndex(this.id));
            });
     
        });    
        
        // We need to store more information in our cache than the table widget needs since we match up
        //  Attributes to Categories, checkboxes and colIndexes.  This translates that cache to a simple 
        //  array for the table widget to consume
        var _getColVisibilityArray = Azavea.tryCatch('get column visibility array', function(){
            var cols = [];
            
            // Grab our vis values from the cache, if they have a name
            $.each(_curTableAttrs.Attrs, function(i, attr){
                if (attr.Name){
                    cols.push(_colVisCache['col-sel-' + attr.UID].visible);
                }
                else {
                    cols.push(false);
                }
            }); 
            return cols;
        });
        
        // When a new data response occurs, we need to grab that to construct our visibility cache
        var _handleNewDataResponse = Azavea.tryCatch('col-sel handle new data response', function(event, newTableAttrs){
            
            if (!_$button){
                return;
            }
            
            
            // Do not show if this was a groupby query
            if (newTableAttrs.GroupByQuery){
                _$button.hide();    
            } else {
                _$button.show();    
            }
            
            // Check if this has the same colums as we had before
            var gotSameCols = Azavea.superEquals(_curTableAttrs.Attrs, newTableAttrs.Attrs);
            
            _curTableAttrs = newTableAttrs;
            
            // If we have different columns, update our cache - if not, they remain the same across
            //  different data requests.
            if (!gotSameCols) {
                
                // Loop through our cache, and update our index,viz for each column/attr
                $.each(_curTableAttrs.Attrs, function (i, attr){
                        _colVisCache['col-sel-' + attr.UID] = { colIndex : i, 
                                                   visible : attr.OnByDefault, 
                                                   UID : attr.UID };
                });
            }
        });
                    
        _self.init = Azavea.tryCatch('init app', function() {
            // Bind, so we know what the current Attribute Table Headers are
            $(_options.bindTo).bind('pdp-data-response', _handleNewDataResponse);
            
            // Bind, so we know what the current structured attribute list is
            $(_options.bindTo).bind('pdp-pdb-attributes', _createColumnPanel);
            
            $(_options.bindTo).bind('pdp-criteria-reset', function() {
                if (_$button){
                    _$button.hide();
                }
            });

            return _self;
        });
        return _self;
    };
}(PDP));