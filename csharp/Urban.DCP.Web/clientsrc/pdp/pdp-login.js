(function(P) {
    P.Login = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                fields: [
                    { id:'username', required:true },
                    { id:'password', required:true }
                ],
                loginTarget:'pdp-header-login'
            }, options),
            _returnUrl = 'default.aspx';
        
        function _displayErrorMsg(msg) {
            $('<span class="pdp-form-messages ui-state-error">' + msg + '</span>').prependTo(_options.target);
            $('#pdp-login-button').removeClass('pdp-input-button-disabled').val('Log In');
        }
        
        var _initLogin = Azavea.tryCatch('init login', function() {
            _returnUrl = Azavea.getStringParam('ReturnUrl') || _returnUrl;
            
            $('.pdp-input:first').focus();
            
            $('#pdp-login-button').click(function() {
                if(!$(this).hasClass('pdp-input-button-disabled')) {
                    $('.pdp-form-messages').remove();
                    $(this).addClass('pdp-input-button-disabled').val('Checking login...');
                    if(P.Form.validate(_options.fields, {}, _options.target)) {
                        var username = $('#username').val(),
                            password = $('#password').val();
                        P.Data.login(username, password, function(user) {
                            window.location.href = decodeURIComponent(_returnUrl);
                        }, function(respText) {
                            _displayErrorMsg(respText);
                        });
                    } else {
                        _displayErrorMsg('All fields are required.');
                        $('.pdp-input-invalid:first').focus();
                    }
                }
            });
        
        });
        
        var _initResetPassword = Azavea.tryCatch('', function(){
            // Bind a click event to the button target
            $('#pdp-reset-password-button').click(function(){
                $('.pdp-form-messages').remove();
                var username = $('#pdp-reset-password-username').val();
                P.Data.resetPassword(username, function(respText){
                    _displayErrorMsg(respText);
                }, function(respText) {
                    _displayErrorMsg(respText);
                }); 
              });
             
        });
        
        var _createLoginForm = Azavea.tryCatch('Create the login form', function() {
            var $form = {},
                username = '',
                password = '',
                button;
                
            // Set up the container with a fieldset and fields
            $form = $('<div class="pdp-login-panel"><fieldset class="pdp-form"><ul></ul></fieldset></div>');
            
            username = '<li><label for="username" class="pdp-form-label">Username</label>' + 
                '<div class="pdp-form-ctrl"><input id="username" type="text" class="pdp-input pdp-input-text" tabindex="1" /></div></li>';
            
            password = '<li><label for="password" class="pdp-form-label">Password</label>' + 
                '<div class="pdp-form-ctrl"><input id="password" type="password" class="pdp-input pdp-input-text" tabindex="2" /></div></li>';
                
            button = '<div class="pdp-form-buttons"><input type="button" id="pdp-login-button" value="Log In" class="pdp-input pdp-input-button pdp-input-button-primary" tabindex="3" /></div>';
            
            // Assemble the form. make it invisible.
            $('ul', $form).append(username, password, button);
            $form.hide();
            
            // Append it to the target
            $(_options.loginTarget).append($form);    
        });
        
        _self.init = function() {
            _createLoginForm();
            _initLogin();
            _initResetPassword();
        
            return _self;
        };
        
        return _self;
    };
})(PDP);