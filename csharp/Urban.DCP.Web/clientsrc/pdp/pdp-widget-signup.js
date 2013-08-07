(function(P) {
    P.Widget.Signup = function(options) {
            var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                fields: [
                    { id:'pdp-signup-username', required:true },
                    { id:'pdp-signup-name', required:true },
                    { id:'pdp-signup-email', required:true, validator:'email' },
                    { id:'pdp-signup-password', required:true, validator:'password' },
                    { id:'pdp-signup-password-2', required:true }
                ],
                signupTarget:'pdp-header-signup',
                landingUrl: 'default.aspx'
            }, options),
            _$form;

        var _clearErrors = Azavea.tryCatch('clear form errors', function(){
            $('.input-invalid', _$form).removeClass('input-invalid');
            $('.pdp-form-messages', _$form).remove();
        });
        
        // Create the html form for log in and password reset and render it to the screen
        var _renderSignupForm = Azavea.tryCatch('create and render the signup form', function() {

            // Generate the markup for the form, and have it hidden
            var _$form = $(_generateFormMarkup()).hide();
                        
            // Enable form submission by hitting "enter" (keycode = 13) in signup form
            $('#pdp-signup-password-2', _$form).keyup(function(event){
                if (event.which === 13){
                    $('#pdp-signup-button').click();
                }
            });
            
            // Close the panel on clicking the X
            $('#pdp-signup-panel-close',_$form).click(function(event){
                _$form.hide();
            });
            
            // Create the signup link that will appear on the header, give it hide/show
            var $signUpLink = $('<a href="javascript:void(0);" class="pdp-link pdp-signup-link">Sign Up</a>');
            $signUpLink.click(function(event) {
                if (_$form.is(':visible')) {
                    _$form.hide();  
                } else {
                    // If I show, hide any other header menu panels
                    $('.pdp-header-panel').hide();
                    _$form.show();
                    _clearErrors();
                    $('#pdp-signup-username', '.pdp-signup-panel').focus();
                }
            });
            
            // Add the whole widget to the page target
            $(_options.target).empty().append($signUpLink, _$form);    
        });
       
        // Setup actions on our form.
        var _initSignup = Azavea.tryCatch('init signup', function() {
            /* NO TOS FOR NOW
            //Bind or TOS link
            $('#pdp-signup-terms-display').click(function(){
                // Dialog the TOS
                $('<iframe id="tos" class="" src="http://furmancenter.org/" />').dialog({
                            title: 'Terms of Service',
                            autoResize: true,
                            autoOpen: true,
                            height: 400,
                            width: 500,
                            modal: true,
		                    buttons: {
			                    Ok: function() {
				                    $(this).dialog('close');
			                    }
			                }
		                });
            });
            */
            
            // Submit our signup data on the button click
            $('#pdp-signup-button').button().click(function() {
                if(!$(this).hasClass('pdp-input-button-disabled')) {
                    $('.pdp-form-messages').remove();
                    $(this).addClass('pdp-input-button-disabled').val('Creating User...');
                    
                    // Try validating the user input
                    if(P.Form.validate(_options.fields, {}, '.pdp-signup-panel')) {
                        var username = $('#pdp-signup-username').val(),
                            password = $('#pdp-signup-password').val(),
                            name = $('#pdp-signup-name').val(),
                            email = $('#pdp-signup-email').val();
                            roles = '';
                        
                        P.Data.createUser(username, name, email, password, roles, function() {
                            //Redirect to the default page
                            P.Data.login(username, password, function(user) {
                                $(_options.bindTo).trigger('pdp-login-success', [user]);
                                $(_options.bindTo).trigger('pdp-login-status-refresh', [user]);
                            }, function() {
                                window.location.href = _options.landingUrl;
                            });
                        }, function(respText) {
                            _displayErrorMsg(respText);
                        });
                    } else {
                        _displayErrorMsg(P.Form.validationMsg);
                        $('.pdp-input-invalid:first', '.pdp-signup-panel').focus();
                    }

                }
            });
        });
        
        // Generate the html form markup
        var _generateFormMarkup = Azavea.tryCatch('generate signup form markup', function(){
            var html =  '<div class="pdp-header-panel pdp-signup-panel ui-corner-all pdp-closable-panel pdp-shadow-drop">' + 
                        '<div id="pdp-signup-panel-close"><span class="ui-icon ui-icon-circle-close"></span></div>' +
                        '<h2 class="pdp-header-panel-title">Sign Up</h2>' +
                        '<fieldset class="">' +
                            '<ul class="pdp-form-list">' +
                                '<li>' +
                                    '<label for="pdp-signup-username" class="pdp-form-label">User Name:</label>' +
                                    '<div class="pdp-form-ctrl">' +
                                        '<input id="pdp-signup-username" type="text" class="pdp-input-shorttext" tabindex="1" />' +
                                    '</div>' +
                                '</li>' +
                                '<li>' +
                                    '<label for="pdp-signup-name" class="pdp-form-label">Name:</label>' +
                                    '<div class="pdp-form-ctrl">' +
                                        '<input id="pdp-signup-name" type="text" class="pdp-input-shorttext" tabindex="2" />' +
                                    '</div>' +
                                '</li>' +
                                '<li>' +
                                    '<label for="pdp-signup-email" class="pdp-form-label">Email:</label>' +
                                    '<div class="pdp-form-ctrl">' +
                                        '<input id="pdp-signup-email" type="text" class="pdp-input-shorttext" tabindex="3" />' +
                                    '</div>' +
                                '</li>' +
                            '</ul>' +
                            '<ul class="pdp-form-list">' +
                                '<li>' +
                                    '<label for="pdp-signup-password" class="pdp-form-label">Password:</label>' +
                                    '<div class="pdp-form-ctrl">' +
                                        '<input id="pdp-signup-password" type="password" class="pdp-input-shorttext" tabindex="4" />' +
                                    '</div>' +
                                '</li>' +
                                '<li>' +
                                    '<label for="pdp-signup-password-2" class="pdp-form-label">Confirm Password:</label>' +
                                    '<div class="pdp-form-ctrl">' +
                                        '<input id="pdp-signup-password-2" type="password" class="pdp-input-shorttext" tabindex="5" />' +
                                    '</div>' +
                                '</li>' +
                                /*'<li>' +
                                    '<div class="pdp-form-ctrl">' +
                                        '<input id="pdp-signup-terms" type="checkbox" class="pdp-input pdp-input-checkbox" tabindex="6" />' +
                                        '<label class="pdp-form-label">I Agree to the <a id="pdp-signup-terms-display" href="javascript:void(0);">Terms of Service</a></label>' +
                                    '</div>' +
                                '</li>' +*/
                            '</ul>' +
                            '<div class="pdp-form-buttons">' +
                                '<button id="pdp-signup-button" class="pdp-button" tabindex="7">Sign Up</button>' +
                            '</div>' +
                        '</fieldset>' + 
                        '<div class="pdp-header-panel-desc">* Signing up allows you to view and filter by extra property characteristics in SHIP (Subsidized Housing Information Project).  This special access is granted to agency partners and others who have made arrangements with the Furman Center.</div>' +                                                 
                        '</div>';
                        
            return html;
        });
              
        var _displayErrorMsg = Azavea.tryCatch('display error message', function(msg) {
            $('<div class="pdp-form-messages ui-state-error">' + msg + '</div>').appendTo('.pdp-signup-panel');
            $('#pdp-signup-button').removeClass('pdp-input-button-disabled').val('Sign Up');
        });
        
        // Initialization routine    
        _self.init = Azavea.tryCatch('init widget signup', function() {
            
            // Bind to the page boss to recieve information on login status.
            // We don't do anything until we have this information.
            $(_options.bindTo).bind('pdp-login-status-refresh', function(event, user){
                if (!user) {
                    // We are not logged in, make thyself
                    _renderSignupForm();
                    _initSignup();
                    $(_options.target).show();
                    
                }
            });
            
            // We want to hide ourselves on a successful login
            $(_options.bindTo).bind('pdp-login-success', function(){
                $(_options.target).hide();
            });
            
            return _self;
        });
        
        return _self;
    };
}(PDP));