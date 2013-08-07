(function (P) {
    var pre = P.Util.prefix;

    P.Form = {
        validators: {
            required: {
                // Check there are 2 password values for required password fields
                password: function(field, dataObj, prefix) {
                    var sel = '#' + pre(prefix, field.id);
                    if($(sel).is(':visible')) {
                        // If password fields are visible, ensure that there are values
                        if(!$(sel).val()) {
                            $(sel + ', ' + sel + '-2').addClass( pre(prefix, 'input-invalid') );
                        }
                    }
                    return true;
                },
                // Check for a value in a required field
                _default: function(field, dataObj, prefix) {
                    var sel = '#' + pre(prefix, field.id);
                    if(!$(sel).val()) {
                        $(sel).addClass( pre(prefix, 'input-invalid') );
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            // Perform password validations.  Assumes 2 password fields named the same with a "-2" appended to one.
            password: function(field, dataObj, prefix) {
                var sel = '#' + pre(prefix, field.id);
                // If password fields are visible, make sure both inputs have same values.
                if($(sel).is(':visible')) {
                    var pw1 = $(sel).val(),
                        pw2 = $(sel + '-2').val();
                    if(pw1 !== pw2) {
                        $(sel + ', ' + sel + '-2').addClass( pre(prefix, 'input-invalid') );
                        P.Form.validationMsg += 'Passwords do not match.';
                        return false;
                    }
                }
                return true;
            },
            // Perform email field validation, including "@" and "." exist
            email: function(field, dataObj, prefix) {
                var sel = '#' + pre(prefix, field.id);
                
                if($(sel).is(':visible')) {
                    var email = $(sel).val();
                    if (email.indexOf('@') === -1 || email.indexOf('.') === -1){
                        $(sel).addClass( pre(prefix, 'input-invalid') );
                        P.Form.validationMsg += 'Email is not valid.';
                        return false;
                    }
                }
                return true;
            },
            // Ensure a field value is numeric
            number: function(field, dataObj, prefix) {
                var sel = '#' + pre(prefix, field.id);
            
                var value = $(sel).val();
                if (value) {
                    value = value.replace(/[$,]/g, '');
                }
                var numberRegex = /^\d*\.?\d*$/;
                // We are allowing for the number 0 to be valid
                if (value === null || !numberRegex.test(value)) {
                    $(sel).addClass( pre(prefix, 'input-invalid') );
                    P.Form.validationMsg += 'Not a valid number';
                    return false;
                }
                return true;
            },
            // Ensure the lower range is lower than the upper range value from the dataObj parameter
            rangeLower: function(field, dataObj, prefix) {
                var sel = '#' + pre(prefix, field.id);
            
                // Must be a number to be in a range
                if (P.Form.validators.number(field, dataObj, prefix)) {
                    var lowerVal = parseFloat($(sel).val());
                    // Check the field value is less than the upper value passed in 
                    if (lowerVal === null || lowerVal > dataObj.upper) {
                        $(sel).addClass( pre(prefix, 'input-invalid') );
                        P.Form.validationMsg += 'The lower range value is greater than the upper range value.';
                        return false;
                    }
                } 
                else {
                    return false;
                }
                return true;    
            },
            // Ensure the upper range is high than the lower range value from the dataObj parameter            
            rangeUpper: function(field, dataObj, prefix) {
                var sel = '#' + pre(prefix, field.id);
                
                // Must be a number to be in a range
                if (P.Form.validators.number(field, dataObj, prefix)) {
                    var upperVal = parseFloat($(sel).val());
                    // Check the field value is more than the lower value passed in 
                    if (upperVal === null || upperVal < dataObj.lower) {
                        $(sel).addClass( pre(prefix, 'input-invalid') );
                        P.Form.validationMsg += 'The upper range value is less than the lower range value.';
                        return false;
                    }
                }
                else {
                    return false;
                }
                return true;    
            },
            // Checks that a field value (number) is between upper/lower values passed in dataObj
            range: function(field, dataObj, prefix) {
                var sel = '#' + pre(prefix, field.id);
                
                // Must be a number to be in a range
                if (P.Form.validators.number(field, dataObj, prefix)) {
                    var val = parseFloat($(sel).val());
                    // Check there is a value and that it is above the min/max from the dataObj
                    if (val === null || val < dataObj.min || val > dataObj.max) {
                        $(sel).addClass( pre(prefix, 'input-invalid') );
                        P.Form.validationMsg += 'The value is not between [' + dataObj.min + '] and [' + dataObj.max + ']';
                        return false;
                    }
                    return true; 
                 }
                 return false;   
            }
        },
        // Perform validation checks on a list of fields, using extra information in the dataObj param
        validate: function(fields, dataObj, container, prefix) {
            P.Form.validationMsg = '';
            // Remove any invalid classes from the fields before validation
            $( '.' + pre(prefix, 'input-invalid'), container || '.pdp-form').removeClass( pre(prefix, 'input-invalid') );

            var valid = true, requiredValid = true;
            
            // Loop through the fields, checking each according to its type
            $.each(fields, function(i, field) {
                if(field.required) {
                    // If this field is required, check to see if there is a custom required validator.
                    var vFn = P.Form.validators.required[field.type || ''] || P.Form.validators.required._default;
                    if(!vFn(field, dataObj, prefix)) {
                        valid = false;
                        if(requiredValid) {
                            P.Form.validationMsg += 'Please enter all required fields.';
                            requiredValid = false;
                        }
                    }
                }
                // If the field passed required validation, validate it against it's content type
                if(valid && field.validator && P.Form.validators[field.validator]) {
                    valid = P.Form.validators[field.validator](field, dataObj, prefix) && valid;
                }
            });
            
            return valid;
        },
        // Sets up a warning message label for any required fields
        setupRequired: function(fields, $context) {
            $.each(fields, function(i, field) {
                if(field.required) {
                    $('label[for=' + field.id + ']', $context).append('<span class="pdp-form-required-label">Required</span>');
                }
            });
        }
    };
}(PDP));