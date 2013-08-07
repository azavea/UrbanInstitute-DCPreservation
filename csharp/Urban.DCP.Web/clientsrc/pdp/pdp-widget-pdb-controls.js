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
    var _makeContainer = Azavea.tryCatch('creating control container', function(id, name, desc) {
        return $('<div class="pdp-pdb-control"><div class="pdp-pdb-control-label ui-state-default"><label class="">' + name + '</label><span class="pdp-pdb-control-label-help ui-icon ui-icon-help" title="'+desc+'"></span></div></div>'); //add a help icon here-ish
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
        range: Azavea.tryCatch('creating range control', function($target, attr) {
            var $container = _makeContainer(attr.UID, attr.QueryName || attr.Name, attr.Desc),
                blurMinText = 'No Min', 
                blurMaxText = 'No Max',
                $lowerContainer,
                $upperContainer;
            
            
            // Create lower and upper boundry inputs
            var $lower = $('<input type="text" class="pdp-input pdp-input-uninit pdp-control-range pdp-control-range-lower" id="l' + attr.UID + '" value="No Min"/>');
            var $upper = $('<input type="text" class="pdp-input pdp-input-uninit pdp-control-range pdp-control-range-upper" id="u' + attr.UID + '" value="No Max"/>'); 
            

            var _onChange = Azavea.tryCatch('range values changed', function(event) {
                var lowerInit = false, 
                    upperInit = false,
                    $upperClear,
                    $lowerClear;
                
                // We could end up where the user has deleted a value, and the input has not
                // been set to uninit because onChange fires before onBlur.  Call onBlur directly, 
                // to accomodate this.
                $(this).blur();
                    
                // Get these values now, so we don't have to keep looking for that class
                if (!$lower.hasClass('pdp-input-uninit')) {
                    lowerInit = true;
                }
                if (!$upper.hasClass('pdp-input-uninit')) {
                    upperInit = true;
                }
                
                // Only attempt to validate if these conditions are met:
                //  a) both lower and upper bounds exist and are not '.pdp-input-uninitialized'
                //  b) upper OR lower exists, and the other is '.pdp-input-uninitialized'
                if ((!upperInit && ($lower.val() || $lower.val() === '0') && lowerInit) || 
                    (!lowerInit && ($upper.val() || $upper.val() === '0') && upperInit) || 
                    (($lower.val() || $lower.val() ==='0') && lowerInit) && (($upper.val() || $upper.val() ==='0') && upperInit)){
                    // Give an X before the control to clear the text
                    $lowerClear = $('.ui-icon-close', $lowerContainer);
                    $upperClear = $('.ui-icon-close', $upperContainer);
                    
                    // Add a lower clear icon
                    if (lowerInit && $lowerClear.length === 0){
                        $lower
                            .before('<span class="ui-icon ui-icon-close left" title="Remove this filter"></span>')
                            .addClass('pdp-pdb-control-input-range-clearable');
                        
                        // This element should now exist
                        $lowerClear = $('.ui-icon-close', $lowerContainer);
                        
                        $lowerClear.click(function(event) { 
                            // Clear the input and call the change event so all our checks are called
                            $lower.val('').change();
                        }); 
                        
                    } else if(!lowerInit && $lowerClear.length > 0){
                        $lowerClear.remove();
                        $lower.removeClass('pdp-pdb-control-input-range-clearable');
                    }
                    
                    // Add an upper clear icon
                    if (upperInit && $upperClear.length === 0){
                        $upper
                            .before('<span class="ui-icon ui-icon-close left" title="Remove this filter"></span>')
                            .addClass('pdp-pdb-control-input-range-clearable');
                        
                        // This element should now exist
                        $upperClear = $('.ui-icon-close', $upperContainer);
                        
                        $upperClear.click(function(event) { 
                            // Clear the input and call the change event so all our checks are called
                            $upper.val('').change();
                        }); 
                        
                    } else if(!upperInit && $upperClear.length > 0){
                        $upperClear.remove();
                        $upper.removeClass('pdp-pdb-control-input-range-clearable');
                    }
                                        
                    _validate();  
                    
                    // Move the input back, because we are also listening for a "enter" down to search
                    $(this).focus();
                }
                else {
                    // No value, remove the clear icon if it exists
                    $('.ui-icon-close', $container).remove();
                    $upper.removeClass('pdp-pdb-control-input-range-clearable');
                    $lower.removeClass('pdp-pdb-control-input-range-clearable');
                    
                    _setNoCriteria();
                }
            });
            
            // When an input on the range gets the focus, remove the class and clear the value
            var _onFocus = Azavea.tryCatch('range input focus', function(event) {
                var $text = $(this);
                if ($text.hasClass('pdp-input-uninit')){
                    // Remove the class, wipe out value
                    $text.removeClass('pdp-input-uninit').val('');
                }                 
            });
            
            // When input blurs, if empty apply class and give default text
            var _onBlur = Azavea.tryCatch('range input blur', function(event) {
                var $text = $(this),
                    msg = blurMaxText;
                    
                // Deterimine which end of the range control this is, and apply the appropriate msg
                if ($text.hasClass('pdp-control-range-lower')){
                    msg = blurMinText;
                }  
                
                if (!$text.val() || $text.val() === msg){
                    // Add the class, give default value
                    $text.addClass('pdp-input-uninit').val(msg);
                    
                    // Remove any invalidation markup
                    $text.removeClass('input-invalid');
                }       
            });
            
            // Send a message, if needed, that this control no longer has valid criteria, and update 
            //  the state for the UI as well
            var _setNoCriteria = Azavea.tryCatch('trigger invalid criteria', function() {
                    // If we were previously active, alert that we no longer are and wipe out any criteria
                    if ($container.hasClass('pdp-pdb-control-active')) {
                        // There are problems with no value or one missing value, remove me from the list
                         _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'le', val:null } ]);
                         _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'ge', val:null } ]);
                    }
                    
                    // Update my container display, we are now inactive
                    $container.removeClass('pdp-pdb-control-active');
                    
                    $('.ui-icon-close', $container).remove();
                    $upper.removeClass('pdp-pdb-control-input-range-clearable');
                    $lower.removeClass('pdp-pdb-control-input-range-clearable');                    
            });
            
            var _validate = Azavea.tryCatch('lower bound range changed', function(event) {
                var fields = [],
                    lowerInit = false, 
                    upperInit = false;
                
                // Get these values now, so we don't have to keep looking for that class
                if (!$lower.hasClass('pdp-input-uninit')) {
                    lowerInit = true;
                }
                if (!$upper.hasClass('pdp-input-uninit')) {
                    upperInit = true;
                }
                
                // To accomodate 'No Min' and 'No Max': don't evaluate the rangeUpper/Lower unless 
                // it is a true range with values in each.  Don't evaluate the range unless
                // the input has an actual value.
                if (lowerInit && upperInit) {
                    fields.push({ id: 'u' + attr.UID, required: false, validator: 'rangeUpper' }); 
                    fields.push({ id: 'l' + attr.UID, required: false, validator: 'rangeLower' });
                    fields.push({ id: 'l' + attr.UID, required: false, validator: 'range' });
                    fields.push({ id: 'u' + attr.UID, required: false, validator: 'range' });
                } else if (lowerInit) {
                    fields.push({ id: 'l' + attr.UID, required: false, validator: 'range' });
                } else if (upperInit) {
                    fields.push({ id: 'u' + attr.UID, required: false, validator: 'range' });
                }
                    
                // Validate normal form fields
                var lower = $lower.val().replace(/[$,]/g, ''),
                    upper = $upper.val().replace(/[$,]/g, '');

                if (P.Form.validate(fields, { lower: lower, upper: upper, min: parseFloat(attr.Min), max: parseFloat(attr.Max) })) {
                    // They exist and are numeric, and respect their criteria bounds
                    // The value of the input, whether typed or selected - could have changed to nothing



                    // Update container to active
                    $container.addClass('pdp-pdb-control-active');
                    
                    // Remove any invalidation markup
                    $lower.removeClass('input-invalid');
                    $upper.removeClass('input-invalid');
                    
                    // Trigger an event for someone to handle both values of range, if they have values
                    if (lowerInit) {
                        _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'ge', val:lower } ]);
                    } else {
                        // It may have been removed, send out a blank value call
                        _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'ge', val:null } ]);
                    }
                    if (upperInit) {
                        _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'le', val:upper } ]);
                    } else {
                        // It may have been removed, send out a blank value call
                        _triggerPropertyCriteriaChange( [ { attr:attr.UID, oper:'le', val:null } ]);
                    }
                } else {
                    // Tell everyone that we failed validation, in case we had passed before
                    _setNoCriteria();
                }
                
                //Format the number (money, etc)
                if (parseFloat(upper)) {
                    $upper.val(P.Util.renderers[attr.ValType](upper));
                }
                if (parseFloat(lower)) {
                    $lower.val(P.Util.renderers[attr.ValType](lower));
                }
            });
              
            // Bind events to changes in value (when the controls lose focus)
            $lower
                .blur(_onBlur)
                .change(_onChange)
                .focus(_onFocus);
                
            $upper
                .blur(_onBlur)
                .change(_onChange)
                .focus(_onFocus);
                
            // Append the input with some labeling inbetween
            $container
                .append('<span class="pdp-pdb-control-range-text">Between</span><div class="pdp-pdb-control-lower pdp-pdb-control-input-range"></div><span class="pdp-pdb-control-range-text">and</span><div class="pdp-pdb-control-upper pdp-pdb-control-input-range"></div>')
                .appendTo($target);
            
            // Put the input in the input control container
            $lowerContainer = $('.pdp-pdb-control-lower', $container).append($lower);
            $upperContainer = $('.pdp-pdb-control-upper', $container).append($upper);
            
            // Listen for a reset trigger to change the value
            _bindReset(function() {
                // Only reset the control if there is a value, to prevent needless trigger calls
                if ($lower.val()) {
                    $lower
                        .val(blurMinText)
                        .addClass('pdp-input-uninit')
                        .removeClass('input-invalid');
                }
                if ($upper.val()) {
                    $upper
                        .val(blurMaxText)
                        .addClass('pdp-input-uninit')
                        .removeClass('input-invalid');
                }

                // Tell the control that it has changed
                _setNoCriteria();
            });
        }), 
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