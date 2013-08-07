// declare global namespace
var Feedbacker = Feedbacker || {};

(function (fbkr) {
    var _admin = function (options) {
        var _self = {},
            _options = $.extend({
                id: 'feedbacker-admin',
                target: 'body',
                cssPath: 'client/feedbacker/css/feedbacker.css',
                resourcePath: 'handlers/feedbacker/',
                authUrl: 'authenticate.ashx',
                databaseUrl: 'database.ashx',
                tabs: [{
                    id: 'list',
                    label: 'View Feedback',
                    component: fbkr.AdminList
                },{
                    id: 'config',
                    label: 'View Configuration',
                    component: fbkr.AdminConfig
                }]
            }, options);
        
        var _authToken = '';
            //_authToken = '36832ae7-cb5a-472b-baaf-4c21bd590e0b';
        var $container,
            $outerList,
            $content;
        
        /// <summary>Add feedbacker CSS file if it doesn't already exist</summary>
        function _addCSS() {
            if(!$('link.feedbacker-theme').length && _options.cssPath) {
                $('head').append('<link href="' + _options.cssPath + '" type="text/css" rel="stylesheet" class="feedbacker-theme" />');
            }
        }
        
        function _checkAuth(success) {
            if(_authToken) {
                success();
            } else {
                _setupLoginForm(success);
            }
        }
        
        function _setupLoginForm(success) {
            var $form = $('<div id="' + _options.id + '-login" class="feedbacker-form feedbacker-loginform"></div>').appendTo($container);
            var $list = $('<ul class="feedbacker-list"></ul>').appendTo($form);
            
            var userId = _options.id + '-username', passId = _options.id + '-password';
            
            var $userLi = $('<li class="feedbacker-field"><label for="' + userId + '">Username</label></li>').appendTo($list);
            var $passLi = $('<li class="feedbacker-field"><label for="' + passId + '">Password</label></li>').appendTo($list);
            
            var $userInput = $('<input id="' + userId + '" name="' + userId + '" type="text" class="feedbacker-textinput" />').appendTo($userLi);
            var $passInput = $('<input id="' + passId + '" name="' + passId + '" type="password" class="feedbacker-textinput" />').appendTo($passLi);
            
            var $error;
            
            $('<button class="feedbacker-button">Login</button>')
                .appendTo($form)
                .click(function() {
                    var username = $userInput.val(),
                        password = $passInput.val();
                    $.ajax({
                        url: _options.resourcePath + _options.authUrl,
                        data: { username:username, password:password },
                        dataType: 'json',
                        type: 'POST',
                        success: function(resp) {
                            if(resp && resp.token) {
                                _authToken = resp.token;
                                success();
                                $form.remove();
                            } else {
                                $error.html('Login failed.').show();
                            }
                        },
                        error: function(resp) {
                            $error.html(resp.responseText).show();
                        }
                    });
                });
                
            $error = $('<p class="feedbacker-error></p>').appendTo($form).hide();
        }
        
        _self.displayMessage = function(msg, error) {
            $messages.stop()[error?'addClass':'removeClass']('feedbacker-error');
            $messages.html(msg).slideDown('fast', function() {
                setTimeout(function() {
                    $messages.slideUp('normal');
                }, 3500);
            });
        };
        
        _self.init = function() {
            _addCSS();
            
            $container = $('<div id="' + _options.id + '" class="feedbacker-content"><h2>Feedbacker Admin</h2></div>').appendTo(_options.target);
            $messages = $('<div id="' + _options.id + '-msgs" class="feedbacker-admin-msgs"></div>').appendTo($container).hide();
            
            _checkAuth(function() {
                $outerList = $('<ul class="feedbacker-list feedbacker-commands"></ul>').appendTo($container);
                $content = $('<div class="feedbacker-admincontent"></div>').appendTo($container);
                
                var options = { target:$content, authToken:_authToken, resourcePath:_options.resourcePath };
                $.each(_options.tabs, function(i, tab) {
                    var cOpts = _options[tab.id + 'Options'] || {};
                    
                    var c = tab.component($.extend(options, cOpts)).init(_self);
                    $('<li><strong>' + tab.label + '</strong></li>').appendTo($outerList).click(function () {
                        $('li.active', $outerList).removeClass('active');
                        $(this).addClass('active');
                        $content.empty();
                        c.load();
                    });
                });
                
                $('li:first', $outerList).click();
            });
        };
        
        return _self;
    };
    
    fbkr.Admin = function (options) {
        var admin = _admin(options);
        
        $(document).ready(function() {
            admin.init();
        });
    };
}(Feedbacker));