(function(P) {
    P.controls = P.controls || {};

    P.controls.Range = function($target, attr, $container, isDate, triggerChange, onReset) {

        var blurMinText = 'No Min' + (isDate ? ' Date' : ''),
            blurMaxText = 'No Max' + (isDate ? ' Date' : ''),
            $lowerContainer,
            $upperContainer,
            validator = isDate ? 'daterange' : 'range',
            validatorL = isDate ? 'daterangeLower' : 'rangeLower',
            validatorU = isDate ? 'daterangeUpper' : 'rangeUpper';

        var onSelect = function() { $(this).removeClass('pdp-input-uninit').change(); };

        // Create lower and upper boundry inputs
        var $lower = $('<input type="text" class="pdp-input pdp-input-uninit pdp-control-' + (isDate ? 'date' : '') + 'range pdp-control-range-lower" id="l' + attr.UID + '" value="' + blurMinText + '"/>');
        var $upper = $('<input type="text" class="pdp-input pdp-input-uninit pdp-control-' + (isDate ? 'date' : '') + 'range pdp-control-range-upper" id="u' + attr.UID + '" value="' + blurMaxText + '"/>');
        
        if (isDate) {
            $lower.datepicker({ onSelect: onSelect });
            $upper.datepicker({ onSelect: onSelect });
        }

        var _onChange = Azavea.tryCatch('range values changed', function() {
            var lowerValIsInitialized = false,
                upperValIsInitialized = false,
                $upperClear,
                $lowerClear;

            // We could end up where the user has deleted a value, and the input has not
            // been set to uninit because onChange fires before onBlur.  Call onBlur directly, 
            // to accomodate this.
            $(this).blur();

            // Get these values now, so we don't have to keep looking for that class
            if (!$lower.hasClass('pdp-input-uninit')) {
                lowerValIsInitialized = true;
            }
            if (!$upper.hasClass('pdp-input-uninit')) {
                upperValIsInitialized = true;
            }

            // Only attempt to validate if these conditions are met:
            //  a) both lower and upper bounds exist and are not '.pdp-input-uninitialized'
            //  b) upper OR lower exists, and the other is '.pdp-input-uninitialized'
            if ((!upperValIsInitialized && ($lower.val() || $lower.val() === '0') && lowerValIsInitialized) ||
                (!lowerValIsInitialized && ($upper.val() || $upper.val() === '0') && upperValIsInitialized) ||
                (($lower.val() || $lower.val() === '0') && lowerValIsInitialized)
                    && (($upper.val() || $upper.val() === '0') && upperValIsInitialized)) {
                // Give an X before the control to clear the text
                $lowerClear = $('.ui-icon-close', $lowerContainer);
                $upperClear = $('.ui-icon-close', $upperContainer);

                // Add a lower clear icon
                if (lowerValIsInitialized && $lowerClear.length === 0) {
                    $lower
                        .before('<span class="ui-icon ui-icon-close left" title="Remove this filter"></span>')
                        .addClass('pdp-pdb-control-input-range-clearable');

                    // This element should now exist
                    $lowerClear = $('.ui-icon-close', $lowerContainer);

                    $lowerClear.click(function() {
                        // Clear the input and call the change event so all our checks are called
                        $lower.val('').change();
                    });

                } else if (!lowerValIsInitialized && $lowerClear.length > 0) {
                    $lowerClear.remove();
                    $lower.removeClass('pdp-pdb-control-input-range-clearable');
                }

                // Add an upper clear icon
                if (upperValIsInitialized && $upperClear.length === 0) {
                    $upper
                        .before('<span class="ui-icon ui-icon-close left" title="Remove this filter"></span>')
                        .addClass('pdp-pdb-control-input-range-clearable');

                    // This element should now exist
                    $upperClear = $('.ui-icon-close', $upperContainer);

                    $upperClear.click(function() {
                        // Clear the input and call the change event so all our checks are called
                        $upper.val('').change();
                    });

                } else if (!upperValIsInitialized && $upperClear.length > 0) {
                    $upperClear.remove();
                    $upper.removeClass('pdp-pdb-control-input-range-clearable');
                }

                _validate();

                // Move the input back, because we are also listening for a "enter" down to search
                $(this).focus();
            } else {
                // No value, remove the clear icon if it exists
                $('.ui-icon-close', $container).remove();
                $upper.removeClass('pdp-pdb-control-input-range-clearable');
                $lower.removeClass('pdp-pdb-control-input-range-clearable');

                _setNoCriteria();
            }
        });

        // When an input on the range gets the focus, remove the class and clear the value
        var _onFocus = Azavea.tryCatch('range input focus', function() {
            var $text = $(this);
            if ($text.hasClass('pdp-input-uninit')) {
                // Remove the class, wipe out value
                $text.removeClass('pdp-input-uninit').val('');
            }
        });

        // When input blurs, if empty apply class and give default text
        var _onBlur = Azavea.tryCatch('range input blur', function() {
            var $text = $(this),
                msg = blurMaxText;

            // Deterimine which end of the range control this is, and apply the appropriate msg
            if ($text.hasClass('pdp-control-range-lower')) {
                msg = blurMinText;
            }

            if (!$text.val() || $text.val() === msg) {
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
                triggerChange([{ attr: attr.UID, oper: 'le', val: null }]);
                triggerChange([{ attr: attr.UID, oper: 'ge', val: null }]);
            }

            // Update my container display, we are now inactive
            $container.removeClass('pdp-pdb-control-active');

            $('.ui-icon-close', $container).remove();
            $upper.removeClass('pdp-pdb-control-input-range-clearable');
            $lower.removeClass('pdp-pdb-control-input-range-clearable');
        });

        var _validate = Azavea.tryCatch('lower bound range changed', function() {
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
                fields.push({ id: 'u' + attr.UID, required: false, validator: validatorU });
                fields.push({ id: 'l' + attr.UID, required: false, validator: validatorL });
                fields.push({ id: 'l' + attr.UID, required: false, validator: validator });
                fields.push({ id: 'u' + attr.UID, required: false, validator: validator });
            } else if (lowerInit) {
                fields.push({ id: 'l' + attr.UID, required: false, validator: validator });
            } else if (upperInit) {
                fields.push({ id: 'u' + attr.UID, required: false, validator: validator });
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
                var lowerVal = lowerInit ? lower : null,
                    upperVal = upperInit ? upper : null;

                triggerChange([{ attr: attr.UID, oper: 'ge', val: lowerVal }]);
                triggerChange([{ attr: attr.UID, oper: 'le', val: upperVal }]);
                
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
            .append('<span class="pdp-pdb-control-range-text">Between</span><div class="pdp-pdb-control-lower pdp-pdb-control-input-range">' +
                '</div><span class="pdp-pdb-control-range-text">and</span><div class="pdp-pdb-control-upper pdp-pdb-control-input-range"></div>')
            .appendTo($target);

        // Put the input in the input control container
        $lowerContainer = $('.pdp-pdb-control-lower', $container).append($lower);
        $upperContainer = $('.pdp-pdb-control-upper', $container).append($upper);

        // Listen for a reset trigger to change the value
        onReset(function() {
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
    };
}(PDP));
