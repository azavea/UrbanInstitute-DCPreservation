(function (P) {
    var _triggerPropertyCriteriaChange = Azavea.tryCatch('trigger property criteria change', function(critArray) {
        $(P.Widget.PdbControls.bindTo).trigger('pdp-pdb-control-change', [ critArray ]);
    });
    
    var _bindReset = Azavea.tryCatch('resetting a control widget', function(callback) {
        $(P.Widget.PdbControls.bindTo).bind('pdp-criteria-reset', function(event) {
            if (callback) {
                callback();
            }
        });
    });

    // All controls will be in identical containers, which are created here
    var _makeContainer = Azavea.tryCatch('creating control container', function (id, name, desc) {
        return $('<div class="pdp-pdb-control"><div class="pdp-pdb-control-label ui-state-default"><label class="">' + name + '</label><span class="pdp-pdb-control-label-help ui-icon ui-icon-help" title="' + (desc || name) + '"></span></div></div>'); //add a help icon here-ish
    });
    
    //<summary>
    //A basic string comparer for sorting an array of objects which have Value property
    //</summary>
    var _compareValues = Azavea.tryCatch('sort: compare dropdown values', function(a, b) {
        var valA = a.Value.toLowerCase( );
        var valB = b.Value.toLowerCase( );
        if (valA < valB) {return -1;}
        if (valA > valB) {return 1;}
        return 0;
    });
    //<summary>
    //A basic string comparer for sorting an array of objects which might have a Group property
    //</summary>    
    var _compareGroups = Azavea.tryCatch('sort: compare group dropdown values', function(a, b) {
        var valA, valB;
        
        if (a.Group) {
            valA = a.Group.toLowerCase( );
        } else {
            return 0;
        }
        if (b.Group) {
            valB = b.Group.toLowerCase( );
        } else {
            return 0;
        }
        
        if (valA < valB) {return -1;}
        if (valA > valB) {return 1;}
        return 0;
    });
                
    P.Widget.PdbControls = {
        bindTo: P.Pdb,
        
        dropdown: Azavea.tryCatch('creating dropdown control', function($target, attr) {
            var $container = _makeContainer(attr.UID, attr.QueryName || attr.Name, attr.Desc),
                _critList = [], //dropdowns can have multiple values, so we need to track them
                optionList = '';
                
            // Dropdowns don't really need validation. Either it is selected or it is not.
            // Build our select element
            var $select = $('<select id="' + attr.UID + '"></select>');
            
            // Handle dropdown selection changes
            var _onChange = Azavea.tryCatch('dropdown control change', function(event) {
                var val = this.value;
                
                if (val) {
                    
                    // Hide this entry from the dropdown if possible.  Some browsers don't support
                    //  display:none on options, so we disable it also.  Some don't support disabled options
                    //  so we also check to make sure it's not already on the critList
                    if ($.inArray(val, _critList) !== -1){
                        //Reset the selection
                        $select.val('');
                        return;
                    }
                    
                    // Bug fix right before production, so I am leaving the original code.  This appears to 
                    // cause an error when there is an apostrophe in the value of a dropdown.  Instead I 
                    // am selecting the options by :selectd
                    //$('option[value="' + val + '"]', $select).attr('disabled', 'disabled').hide();
                    var selectedOption = $('option:selected', $(this)).attr('disabled', 'disabled').hide();
                    
                    // if i have a value, then update my container to active
                    $container.addClass('pdp-pdb-control-active');
                    
                    // Make a span with this value
                    var $crit = $('<div class="pdp-selected-criteria"><span class="ui-icon ui-icon-close left" title="Remove this filter"></span><label title="' + val + '">' + val + '</label></div>')
                        .insertBefore(this);
                    
                    _critList.push(val);
                    
                    //Bind event to remove a selection
                    $('.ui-icon', $crit).click(function(event) {                       
                        var curVal = $('label', $crit).text();
                        
                        $.each(_critList, function(i, val) {
                            if (val === curVal) {
                                _critList.splice(i, 1);
                                
                                //break loop
                                return false;
                            }
                        });
                        
                        // NOTE: Same as above - production release tomorrow, so leaving the orig code - sorry.
                        //Show this in the dropdown again
                        //$('option[value="' + curVal + '"]', $select).removeAttr('disabled').show();
                        selectedOption.removeAttr('disabled').show();
                        
                        //Remove list item
                        $crit.remove(); 
                        
                        _triggerPropertyCriteriaChange( [ { attr:$select.attr('id'), oper:'eq', val:_critList } ]);

                        // If there are no more children, remove the active class
                        if ($('.pdp-selected-criteria', $container).length === 0){
                            $container.removeClass('pdp-pdb-control-active');
                            
                        }
                    });
 
                    //Reset the selection
                    $select.val('');

                    // trigger an event for someone to handle
                    _triggerPropertyCriteriaChange( [ { attr:this.id, oper:'eq', val:_critList } ]);
                } else {
                    // If there are no more children, remove the active class
                    if ($('.pdp-selected-criteria', $container).length === 0){
                        $container.removeClass('pdp-pdb-control-active');
                    }
                }
                
            });
            
            var _getSelectOptions = Azavea.tryCatch('get select options', function(attr){
                var options = '<option value="">- - All - -</option>',
                    group = {}, groups=[], g;
            
                // Sort our option
                attr.Values.sort(_compareValues);
                //attr.Values.sort(_compareGroups);

                $.each (attr.Values, function(i, val) {
                    if (val.Group){
                        if (group[val.Group]){
                            // Add this value to this grouping
                            group[val.Group].push(val.Value);
                        } else {
                            group[val.Group] = [val.Value];
                            groups.push(val.Group);
                        }
                    } else {
                        // Just add stright to the option list
                        options += '<option value="' + val.Value + '">' + val.Value + '</option>';
                    }
                });    
                
                // If we have groups, add options accordingly
                if (groups.length){
                    groups.sort();
                    $.each(groups, function(idx, groupName){
                        
                        options += '<optgroup label="' + groupName + '">';
                        var i;
                        for (i=0; i < group[groupName].length; i++){
                            // Add this under the category
                            options += '<option value="' + group[groupName][i] + '">' + group[groupName][i] + '</option>';
                        }
                        options += '</optgroup>';
                    
                    });
                }   
                
                return options;
            });
            
            // Add our options
            var optionsList = _getSelectOptions(attr);
            
            // Add the options to our select, and bind a function to the change event
            $select.append(optionsList).change(_onChange);
                
            // Add the completed control to a control container and then to the page target
            $container
                .append($select)
                .appendTo($target);
            
            _bindReset(function() {
                // Only reset the control if there are values, to prevent needless trigger calls
                if ($('.ui-icon', $container).length > 0) {
                    $('.ui-icon', $container).click();
                    $select.val('').change();
                }
            });
        }),
        autocomplete: Azavea.tryCatch('', function($target, attr) {
            var $container = _makeContainer(attr.UID, attr.QueryName || attr.Name, attr.Desc),
                valuesArray = [],
                selection = false,
                critAdded = false,
                _critList = []; //autocompletes can have multiple values, so we need to track them

            
            // Build our select element
            var $input = $('<input id="' + attr.UID + '" class="pdp-input pdp-control-autocomplete" type="text" />');            
            
            // Validation: matches a value to an item in the list
            $.expr[':'].textEquals = function (a, i, m) {
                return $(a).text().match("^" + m[3] + "$");
            };

            // Handle the case of selecting an item from the autocomplete, which re-adds the text
            // to the input - which we want cleared after a criteria has been added
            var _onClose = Azavea.tryCatch('autocomplete control close', function(event, ui) {
                if (critAdded){
                    $input.val('');
                    critAdded = false;
                }
            });
            
            // Handle autocomplete selection changes, if they click on a autocomplete suggestion
            var _onSelect = Azavea.tryCatch('autocomplete control select', function(event, ui) {
                // This was a selection
                selection = true;
                
                // Remove any validation markup
                $input.removeClass('input-invalid');
                                        
                // Use the selection as the new value
                _valueChanged(ui.item.value);
                
            });
            
            // Handle autocomplete value changes, if it was typed manually in
            var _onChange = Azavea.tryCatch('autocomplete control change', function(event, ui) {
                // Remove any validation markup
                $input.removeClass('input-invalid');
                                
                // If the selection event did not already take care of this, ie. this value was 
                // only typed in and then lost focus.
                if (!selection) {
                    // If the value of the textbox does not match a suggestion, clear its value
                    if ($(".ui-autocomplete li:textEquals('" + $input.val() + "')").size() === 0 && ($input.val() || $input.val() === 0)) {
                        $input.addClass('input-invalid');
                    }
                    
                    // Use the value of the input as the new value
                    _valueChanged(this.value);
                }
                
                // Clear selection state
                selection = false;
            });
            
            // When the value is changed either by selecting a suggestion or 
            // typing a valid item into the input
            var _valueChanged = Azavea.tryCatch('control value changed', function(val) {
                // The value of the input, whether typed or selected - could have changed to nothing
                if (val && !$input.hasClass('input-invalid')) {
                    // if i have a value, then update my container to active
                    $container.addClass('pdp-pdb-control-active');
                    
                   // Make a span with this value
                    var $crit = $('<div class="pdp-selected-criteria"><span title="Remove this filter" class="ui-icon ui-icon-close left"></span><label title="' + val + '">' + val + '</label></div>')
                        .insertBefore($input);
                    
                    _critList.push(val);
                    
                    //Bind event to remove a selection
                    $('.ui-icon', $crit).click(function(event) {                       
                        var curVal = $('label', $crit).text();
                        
                        $.each(_critList, function(i, val) {
                            if (val === curVal) {
                                _critList.splice(i, 1);
                                
                                //break loop
                                return false;
                            }
                        });
                        
                        //Show this in the dropdown again
                        //$('option[value="' + curVal + '"]', $select).show();
                        
                        //Remove list item
                        $crit.remove(); 
                        
                        _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'eq', val:_critList } ]);

                        // If there are no more children, remove the active class
                        if ($('.pdp-selected-criteria', $container).length === 0){
                            $container.removeClass('pdp-pdb-control-active');
                        }
                    }); 
                    
                    // Hide this entry from the dropdown
                    //$('option[value="' + val + '"]', $select).hide();
                    
                    //Reset the selection
                    $input.val('');
                    critAdded = true;
                    
                    // trigger an event for someone to handle
                    _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'eq', val:_critList } ]);
                                       
                                        
                } else {
                    // If there are no more children, remove the active class
                    if ($('.pdp-selected-criteria', $container).length === 0){
                        $container.removeClass('pdp-pdb-control-active');
                    }
                        
                    // Remove the previous value
                    val='';
                }

                // trigger an event for someone to handle
                //_triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'eq', val:val } ]);
            });
                        
            // Build our autocomplete value list
            $.each(attr.Values, function(i, valObj) {
                valuesArray.push(valObj.Value);
            });
            
            // Add our available values, and bind on select and change events
            $input.autocomplete({
			    source: valuesArray,
			    change: _onChange,
			    select: _onSelect,
			    close: _onClose,
			    minLength: 2
		    });

            // Add the completed control to a control container and then to the page target
            $target.append($container.append($input));
            
            // Listen for a reset trigger to change the value
            _bindReset(function() {
                // Only reset the control if there is a value, to prevent needless trigger calls
                if ($('.ui-icon', $container).length > 0) {
                    $('.ui-icon', $container).click();
                    $input.val('');
                }
            });

          }),
        range: Azavea.tryCatch('creating range control', function($target, attr, isDate) {
            var $container = _makeContainer(attr.UID, attr.QueryName || attr.Name, attr.Desc);
            var r = new PDP.controls.Range($target, attr, $container, isDate,
                _triggerPropertyCriteriaChange, _bindReset);
        }),
        
        daterange: function($target, attr) {
            PDP.Widget.PdbControls.range($target, attr, true);
        },
        
        wildcard: function($target, attr){
            PDP.Widget.PdbControls.free($target, attr, 'lk');
        },
        
        free: Azavea.tryCatch('creating freetext control', function($target, attr, operator) {
            var $container = _makeContainer(attr.UID, attr.QueryName || attr.Name, attr.Desc),
                $input = $('<input id="' + attr.UID + '" type="text" class="pdp-input pdp-control-free" />'),
                op = operator ? operator : 'eq';
            
            var _onChange = Azavea.tryCatch('free text control changed', function (event) {
                var valid = true,
                    $clear;
                
                // Remove any validation markup
                $input.removeClass('input-invalid');
                                              
                if (valid && $input.val()) {
                    $input.val(P.Util.renderers[attr.ValType]($input.val()));
                
                    // If i have a value, then update my container to active
                    $container.addClass('pdp-pdb-control-active');
                    _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper: op, val:$input.val() } ]); 
                    
                    // Give an X before the control to clear the text
                    $clear = $('.ui-icon-close', $container);
                    if ($clear.length === 0){
                        $input.before('<span class="ui-icon ui-icon-close left" title="Remove this filter"></span>');
                        
                        // This element should now exist
                        $clear = $('.ui-icon-close', $container);
                        
                        $clear.click(function(event) { 
                            // Clear the input and call the change event so all our checks are called
                            $input.val('').change();
                        });   
                    }
                }
                else {
                    // No value, remove the clear icon if it exists
                    $('.ui-icon-close', $container).remove();
                    
                    // Not valid
                    if ($container.hasClass('pdp-pdb-control-active')) {
                        // No longer active
                        $container.removeClass('pdp-pdb-control-active');   
                        
                        // Trigger an event for someone to handle
                        _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper: op, val:null }]); 
                        
                    }
                }
            });
           
            // Bind the change event
            $input.change(_onChange);
                
            // Append the control container 
            $container
                .append('<div class="pdp-pdb-control-input"></div>')
                .appendTo($target);
            
            // Put the input in the input control container
            $('.pdp-pdb-control-input', $container).append($input);
            
            // Listen for a reset trigger to change the value
            _bindReset(function() {
                // Only reset the control if there is a value, to prevent needless trigger calls
                if ($input.val()) {
                    // Clear the value
                    $input.val('');
                    
                    // Tell the control that it has changed
                    _onChange();
                }
            });
        })
    };
}(PDP));
