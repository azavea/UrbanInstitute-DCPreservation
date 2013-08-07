(function (fbkr) {
    fbkr.AdminConfig = function(options) {
        var _self = {},
            _options = $.extend({
                id: 'feedbacker-admin-config',
                target: 'body',
                resourcePath: 'handlers/feedbacker/',
                configUrl: 'configuration.ashx',
                authToken: ''
            }, options),
            _manager;

        _self.load = function() {
            $container = $('<div id="' + _options.id + '"></div>').appendTo(_options.target).html('Loading ...');
            
            function renderConfig(config) {
                if(config && config.Components) {
                    var configHtml = '<ul class="feedbacker-list feedbacker-configlist">';
                    $.each(config.Components, function(i, component) {
                        configHtml += '<li>';
                        configHtml += '<h4>' + component.Name + '</h4>';
                        
                        if(component.Items) {
                            configHtml += '<ul class="feedbacker-list">';
                            $.each(component.Items, function(i, item) {
                                configHtml += '<li>';
                                configHtml += '<strong>' + item.Key + '</strong> = ';
                                configHtml += '<span>' + item.Value + '</span>';
                                configHtml += '</li>';
                            });
                            configHtml += '</ul>';
                        }
                        
                        configHtml += '</li>';
                    });
                    configHtml += '</ul>';
                }
                $container.html(configHtml);
                $('.feedbacker-configlist > li h4', $container).toggle(function() {
                    $(this).parent().addClass('active');
                    $(this).siblings('ul').slideDown('fast');
                }, function() {
                    $(this).siblings('ul').slideUp('fast', function() {
                        $(this).parent().removeClass('active');
                    });
                });
            }
            
            $.ajax({
                url: _options.resourcePath + _options.configUrl,
                data: { token:_options.authToken },
                dataType: 'json',
                type: 'GET',
                success: function(resp) {
                    renderConfig(resp);
                },
                error: function(resp) {
                    $content.html('<p class="feedbacker-error">' + resp.responseText + '</p>');
                }
            });
        };

        _self.init = function (manager) {
            _manager = manager;
            
            $(_options.target).addClass('feedbacker-adminconfig');
            
            return _self;
        };
        
        return _self;
    };
})(Feedbacker);