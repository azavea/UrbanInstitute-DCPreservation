(function(P) {
    P.Profile = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                fields: [
                    { id:'name', required:true },
                    { id:'email', required:true, validator:'email' },
                    { id:'password', required:true, type:'password', validator:'password' },
                    { id:'password-2', required:true, type:'password' }
                ]
            }, options);
        
        // Display error message
        var _displayErrorMsg = function(msg) {
            $('<span class="pdp-form-messages ui-state-error">' + msg + '</span>').appendTo('.pdp-form');
            $('#pdp-signup-button').removeClass('pdp-input-button-disabled').val('Update');
        };
        
        // Show hide div container around password elements
        var _togglePasswordElements = function() {
            $('#pdp-password-container').toggle(this.checked);
        };
        
        // Populates form data elements with user data
        var _populateUserDataElements = function(user) {
            $('#pdp-name').val(user.Name);
            $('#pdp-email').val(user.Email);
        };
            
        _self.init = Azavea.tryCatch('init profile', function() {
            
            // Set the right ref path
            P.Data.path = '../';

            // Login widget setup
            PDP.Widget.Login({ 
                target: '#login',
                profileUrl: 'user/profile.aspx',
                logoutUrl: 'default.aspx',
                adminUrl: 'admin/manage-users.aspx',
                appUrl: _options.appUrl
            }).init();
            
            P.Util.initLoginStatus();  

            // Set focus to first element
            $('.pdp-input:first').focus();
            
            // Uncheck change password ckbox, hide password elements
            $('#pdp-change-password').attr('checked', false);
            _togglePasswordElements();

            // Get the user data and pre-populate the user fields                      
            P.Data.getUser( _options.userName, _populateUserDataElements);
            
            // Show password fields only if the checkbox is selected
            $('#pdp-change-password').change(_togglePasswordElements);
            
            // Enable form submission by hitting "enter" (keycode = 13) in form
            $('#pdp-password-2').keyup(function(event){
                if (event.which === 13){
                    $('#pdp-update-button').click();
                }
            });
            $('#pdp-email').keyup(function(event){
                if (event.which === 13){
                    $('#pdp-update-button').click();
                }
            });
            
            // Bind a click event
            $('#pdp-update-button').button().click(function() {
                if(!$(this).hasClass('pdp-input-button-disabled')) {
                    $('.pdp-form-messages').remove();
                    
                    // Disable from clicking twice
                    $(this).addClass('pdp-input-button-disabled').val('Saving...');
                    
                    // Validate our few fields
                    if(P.Form.validate(_options.fields, {}, _options.target, P.prefix)) {
                            var password = $('#pdp-password').val(),
                            name = $('#pdp-name').val(),
                            email = $('#pdp-email').val();
                            roles = '';
                        
                        // Send the data to be updated
                        P.Data.updateUser( _options.userName, name, email, password, roles, function(user) {
                                //Success
                                P.Util.quickAlert('Your profile has been updated.');
                                
                                // Let the login people know that the info has changed
                                $(_options.bindTo).trigger('pdp-login-status-refresh', [user]);
                                
                            }, function(respText) {
                                // Failure
                                _displayErrorMsg(respText);
                            });
                    } else {
                        _displayErrorMsg('All fields are required.');
                        $('.pdp-input-invalid:first').focus();
                    }
                    
                    // Re-enable the update button
                    $(this).removeClass('pdp-input-button-disabled').val('Update');
                }
            });
        
            return _self;
        });
        
        return _self;
    };
}(PDP));