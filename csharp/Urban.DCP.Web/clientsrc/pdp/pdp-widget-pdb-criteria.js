(function(P) {
    P.Widget.PdbCriteria = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P.Pdb
            }, options),
            _flatAttrGroups = {},
            _criteria = [],
            _attributes,
            _viewingClass = 'pdp-pdb-search-category-header-viewing';
        
        // Flatten attribute cats to be keyed by the attribute with an value of each parent
        // cat.  Ie. { 'LIHTCStatus': ['LIHTC Details', 'Subsidy Information'], ... }
        var _flattenAttrGroups = Azavea.tryCatch('flatten attr cats', function(attrGroups) {
            $.each(attrGroups, function(i, obj) {
                if (obj.Attrs) {
                    $.each(obj.Attrs, function (j, attr) {
                        _flatAttrGroups[attr.UID] = [attr.Category];
                        
                        if (attr.SubCat) {
                            _flatAttrGroups[attr.UID].push(attr.SubCat);
                        }
                    });
                
                    // Flatten sub cats
                    if (obj.SubCats && obj.SubCats.length) {
                        _flattenAttrGroups(obj.SubCats);
                    }
                }    
            });
        });
        
        // Update the UI with the necessary indicators to show that controls are active or not.
        var _updateCriteriaUi = Azavea.tryCatch('update property criteria ui', function() {
            var groupCounts = {};
            // For each active criteria
            $.each(_criteria, function(i, crit) {
                // For each category for that criteria
                $.each(_flatAttrGroups[crit.attr], function(j, cat) {
                    // Count the number of active criteria
                    if (groupCounts[cat]) {
                        groupCounts[cat]++;
                    } else {
                        groupCounts[cat] = 1;
                    }
                });
                
                //Allow the controls to set the active class themselves.  Some of them need
                //some special control (like range)
            });
            
            //Activate the categories
            $('.pdp-pdb-search-category-header').removeClass('pdp-pdb-control-active');
            $('.pdp-pdb-search-active-count')
                .text('');
            $.each(groupCounts, function(name, count) {
                $('.pdp-pdb-search-category-header-label:contains("' + name + '")').parent('.pdp-pdb-search-category-header')
                    .addClass('pdp-pdb-control-active')
                    .find('.pdp-pdb-search-active-count')
                    .text(count);
            });
        });
        
        // Update the current criteria with new criteria. Handles removing falsely (non-zero)
        // values from the list, updating truthy values, and adding new ones.
        var _updateCriteriaCache = Azavea.tryCatch('update property criteria', function(newCrit) {
            var indexesToRemove =[],
                needToAdd = true;
                            
            // Loop through and mark to add, or mark for deletion if a new one should override an existing criteria
            if (_criteria && _criteria.length) {
                $.each(_criteria, function(i, curCrit) {
                    //Same attr and operator, and updating a crit with a particular value
                    if (curCrit.attr === newCrit.attr && curCrit.oper === newCrit.oper) {
                        // Must be truthy, zero and if truthy not be an array
                        if ((newCrit.val && !$.isArray(newCrit.val)) || newCrit.val === 0 || ( $.isArray(newCrit.val) && newCrit.val.length > 0 )) {
                            curCrit.val = newCrit.val;
                            needToAdd = false;
                        } else {
                            needToAdd = false;
                            indexesToRemove.push(i);
                        }
                    }
                });
            } else {
                // Only add if there is a value
                if (newCrit.val || newCrit.val === 0) {
                    _criteria.push(newCrit);
                    needToAdd = false;
                }
            }
            
            // If this criteria was not updating an existing criteria, nor removing one, add it now
            //  if it has a truthy value.
            if (needToAdd && (newCrit.val || newCrit.val === 0)){
                _criteria.push(newCrit);
            }
            
            // Remove the indexes in reverse order, so the array indexes don't change as we splice
            var i;
            for(i=indexesToRemove.length -1; i>-1; i--) {
                _criteria.splice(indexesToRemove[i], 1);
            }
        });
        
        //Hides the subcategories if a parent category is hidden - we don't want any orphans.
        var _hideLevel = Azavea.tryCatch('hide subcategory', function ($level) {
            $level.slideUp();
            
            // Remove any active states from yourself and your ancestor    
            $('.' + _viewingClass, $level).removeClass(_viewingClass);
            $level.parents('.' + _viewingClass).removeClass(_viewingClass);
        });

        //Bind criteria events
        var _bindEvents = Azavea.tryCatch('bind pdb-search events', function ($content) {
            
            //A control value changed - update the cache and the UI
            $(_options.bindTo).bind('pdp-pdb-control-change', function(event, newCritArray) {
                // each crit object looks like this: { a:'attrId', o:'operator', v:'value' }
                $.each(newCritArray, function(i, crit) {
                    _updateCriteriaCache(crit);
                    _updateCriteriaUi();
                });
                
                //Trigger a criteria change event
                $(_options.bindTo).trigger('pdp-pdb-criteria-change', [ _criteria ]);
            });

            //Someone clicked on a category header. Close other panels and open this one.
            $('.pdp-pdb-search-category-header', $content).click(function (event) {
                var catName = $('label', this).text(),
                    $subcat = $('ul[rel="' + catName + '"]'),
                    $parent,
                    $this = $(this);
                
                if ($subcat.is(':visible')) {
                    _hideLevel($subcat);
                    $this.removeClass(_viewingClass);
                } else {
                    $('ul.pdp-criteria-list').slideUp();
                    
                    //Show the new one
                    $parent = $subcat.parents('.pdp-pdb-search-level').show();
                    $subcat.slideDown();
                    
                    // Add the caption to the subcat window
                    $('.pdp-pdb-search-category-title', $parent).text(catName);

                    // Remove styling classes from siblings so they don't look activated
                    $('.' + _viewingClass).removeClass(_viewingClass);
                    $this.addClass(_viewingClass);

                }
            });
            
            $(_options.bindTo).bind('pdp-criteria-reset', function(event) {
                _criteria = [];
                _updateCriteriaUi();
            });
        });


        var _renderAttributes = Azavea.tryCatch('render pdb attributes', function (data, level, parentName, orderedList) {
            var $container, isSubcat;
            
            if (data.length) {
                $container = $('[rel="'+parentName+'"]');
                //Make the container if it doesn't already exist
                if ($container.length === 0) {
                    $container = $('<ul rel="' + (parentName || '') + '"></ul>').appendTo('#pdp-pdb-search-level-' + level);
                }
                
                //Add category labels and containers for the next level
                $.each(data, function(i, cat) {
                    // Create an array for everything that will get listed on this panel, it will be as big as
                    // the number of attributes + the number of sub cats.  
                    var size = cat.Attrs.length;
                    orderedList = [];
                    orderedList.length = size;
                                                    
                    var $header = $('<li><div class="pdp-cat-' + cat.Name + ' pdp-pdb-search-category-header"><span class="pdp-pdb-search-arrow ui-icon ui-icon-play right"></span>' +
                         '<span class="pdp-pdb-search-active-count right"></span>' + 
                        '<label class="pdp-pdb-search-category-header-label">'+cat.Name+'</label></div></li>');
                    $header.appendTo($container);
                
                    var $subContainer = $('<ul rel="' + (cat.Name || '') + '" class="pdp-criteria-list"></ul>')
                        .appendTo($container)
                        .hide();
                    
                    $.each(cat.Attrs, function (i, attr) {
                        var $widget;
                        if (attr.CanQuery) {
                            // Test out renderer
                            if (P.Widget.PdbControls[attr.UiType]) {
                                $widget = $('<li></li>');
                                if (P.Widget.PdbControls[attr.UiType]){
                                    P.Widget.PdbControls[attr.UiType]($widget, attr);
                                    if (isSubcat){
                                        // A subcategory attribute gets rendered right away
                                        $widget.appendTo($subContainer);
                                    } else {
                                        // Add this control to our ordered list
                                        orderedList[parseInt(attr.CategoryOrder, 10) - 1] = {li: $widget, target: $subContainer};
                                    }
                                }
                                else {
                                    // There is no renderer for this type of control.
                                    Azavea.log('No control renderer defined for: [' + attr.UiType + '].  Control [' + attr.UID + '] was not rendered!');
                                }
                            }
                        }
                    });
                    
                    if (!isSubcat){
                        // We now have an ordered list, render it to the screen
                        $.each(orderedList, function(i, item){
                            // Append each item to the container it belongs to
                            if (item){
                                item.li.appendTo($subContainer);
                            }
                        });
                        
                        // Clear our sortedList, we're done with this one
                        orderedList = null;
                    }
                    
                    
                });
                
            }
        });

        //Render placeholders to the target
        var _render = Azavea.tryCatch('render pdb criteria', function() {
            $('<div id="pdp-pdb-search-level-container" class="pdp-closable-panel-button">' + 
                '<div id="pdp-pdb-search-level-0" rel="0" class="pdp-pdb-search-level"><span class="pdp-pdb-search-category-close ui-icon ui-icon-circle-close"></span></div>' + 
                '<div id="pdp-pdb-search-level-1" rel="1" class="pdp-pdb-search-level"><div class="pdp-pdb-search-category-top ui-state-default"><span class="pdp-pdb-search-category-close ui-icon ui-icon-circle-close right"></span><label class="pdp-pdb-search-category-title"></label></div></div>' + 
                '<div id="pdp-pdb-search-level-2" rel="2" class="pdp-pdb-search-level"><div class="pdp-pdb-search-category-top ui-state-default"><span class="pdp-pdb-search-category-close ui-icon ui-icon-circle-close right"></span><label class="pdp-pdb-search-category-title"></label></div></div>' + 
            '</div>')
                .appendTo(_options.target);
            
            //Build the criteria panel
            _renderAttributes(_attributes, 0);
            
            // After all controls are rendered, apply an event to submit the search on enter
            //  We want keyUP because the control may have yet to complete its change event to update
            //  criteria
            $('.pdp-pdb-search-level input, .pdp-pdb-search-level select').keyup(function(event){
                if (event.keyCode === 13){
                    $(_options.bindTo).trigger('pdp-data-force-update');
                    
                    // Close any panels
                    $('.pdp-closable-panel').hide();
                }
            });
                
            $('.pdp-pdb-control-label-help').tooltip({
                tipClass: 'pdp-pdb-control-tooltip',
                
	            // place tooltip on the right edge
	            position: 'center right',

	            // a little tweaking of the position
	            offset: [-2, 10],

	            // use the built-in fadeIn/fadeOut effect
	            effect: "fade"
            });
        });
            
        _self.init = Azavea.tryCatch('init pdb criteria', function() {
            $(_options.bindTo).bind('pdp-pdb-attributes', function(event, attrResp) {
                try {
                    _attributes = attrResp.List;
                    _flattenAttrGroups(_attributes);
                    _render();
                    _bindEvents();
                }
                finally {
                    // Stop the loading indicator
                    $(_options.bindTo).trigger('pdp-loading-finished');
                }
            });

            return _self;
        });
        
        return _self;
    };
}(PDP));
