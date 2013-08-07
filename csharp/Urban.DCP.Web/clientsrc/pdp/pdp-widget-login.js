(function(P) {
    P.Widget.Login = function(options) {
var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                fields: [
                    { id:'pdp-login-username', required:true },
                    { id:'pdp-login-password', required:true }
                ],
                adminUrl: 'admin/manage-users.aspx',
                logoutUrl: 'default.aspx',
                profileUrl: 'user/profile.aspx',
                appUrl: ''
            }, options),
                _$form;

        var _clearErrors = Azavea.tryCatch('clear form errors', function(){
            $('.input-invalid', _$form).removeClass('input-invalid');
            $('.pdp-form-messages', _$form).remove();
        });

        // Create the html form for log in and password reset and render it to the screen
        var _renderLoginForm = Azavea.tryCatch('create and render the login form', function() {
            var forgotPassword = '',
                $loginLink = '';
                
            // Set up the container with a fieldset and fields for logging in and reseting password
            _$form = $('<div class="pdp-header-panel pdp-login-panel pdp-closable-panel ui-corner-all pdp-shadow-drop"><h2>Log In</h2>' + 
                        '<div id="pdp-login-panel-close"><span class="ui-icon ui-icon-circle-close"></span></div>' +
                        '<fieldset class=""><ul>' + 
                            '<li><label for="pdp-login-username" class="pdp-form-label">Username:</label>' + 
                            '<div class="pdp-form-ctrl"><input id="pdp-login-username" type="text" class="pdp-input pdp-input-shorttext" tabindex="1" /></div></li>' +         
                            '<li><label for="pdp-login-password" class="pdp-form-label">Password:</label>' + 
                            '<div class="pdp-form-ctrl"><input id="pdp-login-password" type="password" class="pdp-input pdp-input-shorttext" tabindex="2" /></div></li>' + 
                            '<li><div class="pdp-form-buttons"><button id="pdp-login-button" class="pdp-button pdp-input-button-primary" tabindex="3">Log In</button>' + 
                            '<a href="javascript:void(0);" id="pdp-show-password-reset">Forgot Password?</a></div></li>' + 
                        '</ul></fieldset></div>');

            forgotPassword = '<fieldset class="pdp-password-reset-container">' + 
                            '<h2>Reset Password</h2>' + 
                            '<ul>' + 
                                '<li>' + 
                                    '<label for="pdp-reset-password-username" class="">Enter your username to reset your password:</label>' + 
                                    '<div class="pdp-form-ctrl">' + 
                                        '<input id="pdp-reset-password-username" type="text" class="pdp-input pdp-input-shorttext" tabindex="4" />' + 
                                    '</div>' + 
                                '</li>' + 
                            '</ul>' + 
                            '<div class="pdp-form-buttons">' + 
                                '<button id="pdp-reset-password-button" value="Reset Password" class="pdp-button pdp-input-button-primary" tabindex="5">Reset Password</button>' + 
                            '</div>' + 
                        '</fieldset>';
                        
            // Assemble the form, make it invisible.
            _$form.append(forgotPassword).hide();
            $('.pdp-password-reset-container', _$form).hide();
            
            // Enable form submission by hitting "enter" (keycode = 13) in login or reset forms
            $('#pdp-login-password', _$form).keyup(function(event){
                if (event.which === 13){
                    $('#pdp-login-button').click();
                }
            });
            $('#pdp-reset-password-username', _$form).keyup(function(event){
                if (event.which === 13){
                    $('#pdp-reset-password-button').click();
                }
            });
            
            // Close the panel on clicking the X
            $('#pdp-login-panel-close', _$form).click(function(event){
                _$form.hide();
            });
            
            // Make forgot password show/hide
            $('#pdp-show-password-reset', _$form).click(function(event) {
                _clearErrors();
                $('.pdp-password-reset-container').toggle();
            });
            
            // Create the login link that will appear on the header, add it to the target
            $loginLink = $('<a href="javascript:void(0);" class="pdp-link pdp-header-link">Login</a>');
            $loginLink.click(function(event) {
                if (_$form.is(':visible')) {
                    _$form.hide();  
                } else {
                    _$form.show();
                    _clearErrors();
                    // Focus first input
                    $('.pdp-input:first', '.pdp-login-panel').focus();
                }
            });
            
            // Add the whole widget to the page target
            $(_options.target).empty().append($loginLink, _$form);    
        });
        

        // Display our login information on the widget, with profile, admin and logout links.
        var _displayLoginInfo = Azavea.tryCatch('display login info', function(user){
            var profile='',
                admin = '',
                $logout = {};
                
            // Hide our form, link
            $('pdp-login-panel').remove();
            $('pdp-login-link').remove();
            
            // Show our user name and a logout option
            profile = 'Welcome,<a href="' + decodeURI(_options.appUrl + _options.profileUrl) + '" class="pdp-link pdp-header-link">' + user.Name + '</a>';
            
            // If the user has roles, then it is a sysadmin, we can show the admin link
            if (user.Admin) {
                admin = '<a href="' + decodeURI(_options.appUrl +  _options.adminUrl) + '" class="pdp-link pdp-header-link">User Administration</a>';
            }
            
            // Setup a log out link that logs out and redirects to a safe page
            $logout = $('<a href="javascript:void(0);" class="pdp-link pdp-header-link">Logout</a>');
            $logout.click(function(event) {
                P.Data.logout(function() {
                    // A successful log-out procedure, now simply re-direct
                    window.location.href = decodeURIComponent(_options.logoutUrl);
                });
            });
            $(_options.target).empty().append(profile, admin, $logout);
        });
        
        // Setup actions on our form.
        var _initLogin = Azavea.tryCatch('init login', function() {
            // Submit our login data on the button click
            $('#pdp-login-button').button().click(function() {
                if(!$(this).hasClass('pdp-input-button-disabled')) {
                    $('.pdp-form-messages').remove();
                    $(this).addClass('pdp-input-button-disabled').val('Checking login...');
                    if(P.Form.validate(_options.fields, {}, _options.target)) {
                        var username = $('#pdp-login-username').val(),
                            password = $('#pdp-login-password').val();
                        P.Data.login(username, password, function(user) {
                            // Reload the page so the user gets any new attributes loaded.
                            //  If we decided we don't want a page refresh, take this line out
                            //  and figure out how to get the new criteria search controls in the
                            //  search and the results column selector
                            location.reload(true);
                            
                            // Annouce we have logged in, people might show/hide themselves
                            $(_options.bindTo).trigger('pdp-login-success', [user]);
                            
                            // Show our user info links
                            _displayLoginInfo(user);
                        }, function(respText) {
                            _displayErrorMsg(respText);
                        });
                    } else {
                        _displayErrorMsg(P.Form.validationMsg);
                        $('.pdp-input-invalid:first', '.pdp-login-panel').focus();
                    }
                }
            });
        });
        
        // Setup actions for our password reset form
        var _initResetPassword = Azavea.tryCatch('initialize password reset', function(){
            // Bind a click event to the button target
            $('#pdp-reset-password-button').button().click(function(){
                $('.pdp-form-messages').remove();
                if(P.Form.validate([{ id:'pdp-reset-password-username', required:true }], {}, _options.target)) {
                    var username = $('#pdp-reset-password-username').val();
                    P.Data.resetPassword(username, function(respText){
                        _displayInfoMsg(respText);
                    }, function(respText) {
                        _displayErrorMsg(respText);
                    }); 
                }else {
                    _displayErrorMsg(P.Form.validationMsg);
                    $('.pdp-input-invalid:first', '.pdp-login-panel').focus();
                }
              });
        });
        
        var _displayMsg = Azavea.tryCatch('display error message', function(msg, className) {
            $('<div class="pdp-form-messages ' + className + '">' + msg + '</div>').appendTo('.pdp-login-panel');
            $('#pdp-login-button').removeClass('pdp-input-button-disabled').val('Log In');
        });
        
        var _displayErrorMsg = Azavea.tryCatch('display error message', function(msg) {
            _displayMsg(msg, 'ui-state-error');
        });
        
        var _displayInfoMsg = Azavea.tryCatch('display error message', function(msg) {
            _displayMsg(msg, '');
        });
        
        // Refresh current login details
        var _initLoginPanel = Azavea.tryCatch('refresh login panel', function(event, user) {
                if (user) {
                    // We are logged in
                    _displayLoginInfo(user);
                } else {
                    // We are not logged in
                    _renderLoginForm();
                    _initLogin();
                    _initResetPassword();
                }              
        });
               
        // Initialization routine    
        _self.init = Azavea.tryCatch('init widget login', function() {
             
            // Bind to the page boss to recieve information on login status.
            // We don't do anything until we have this information.
            $(_options.bindTo).bind('pdp-login-status-refresh', _initLoginPanel);

            return _self;
        });
        
        return _self;
    };
}(PDP));