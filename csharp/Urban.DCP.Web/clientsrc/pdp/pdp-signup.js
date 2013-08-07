(function(P) {
    P.Signup = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                fields: [
                    { id:'username', required:true },
                    { id:'name', required:true },
                    { id:'email', required:true, validator:'email' },
                    { id:'password', required:true, validator:'password' },
                    { id:'password-2', required:true }
                ]
            }, options),
            _returnUrl = 'default.aspx';
        
        var _displayErrorMsg = function(msg) {
            $('<span class="pdp-form-messages ui-state-error">' + msg + '</span>').prependTo(_options.target);
            $('#pdp-signup-button').removeClass('pdp-input-button-disabled').val('Sign Up');
        };
        
        _self.init = Azavea.tryCatch('init signup', function() {
            _returnUrl = Azavea.getStringParam('ReturnUrl') || _returnUrl;
            
            $('.pdp-input:first').focus();
            
            $('#pdp-signup-button').click(function() {
                if(!$(this).hasClass('pdp-input-button-disabled')) {
                    $('.pdp-form-messages').remove();
                    
                    $(this).addClass('pdp-input-button-disabled').val('Submitting...');
                    
                    if(P.Form.validate(_options.fields, {}, _options.target, P.prefix)) {
                        var username = $('#pdp-username').val(),
                            password = $('#pdp-password').val(),
                            name = $('#pdp-name').val(),
                            email = $('#pdp-email').val();
                            roles = '';
                        
                        P.Data.createUser(username, name, email, password, roles, function() {
                            //Redirect to the default page
                            
                            P.Data.login(username, password, function() {
                                window.location.href = 'default.aspx';
                            }, function() {
                                window.location.href = 'default.aspx';
                            });
                        }, function(respText) {
                            _displayErrorMsg(respText);
                        });
                    } else {
                        _displayErrorMsg('All fields are required.');
                        $('.pdp-input-invalid:first').focus();
                    }
                }
            });
        
            return _self;
        });
        
        return _self;
    };
})(PDP);