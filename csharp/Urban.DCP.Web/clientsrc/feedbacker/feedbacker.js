// declare global namespace
var Feedbacker = {};

(function (fbkr, $) {
    var _main = function (options) {
        var _self = {},
            _options = $.extend({
                id: 'feedbacker',
                target: 'body',
                display: 'float',
                orientation: 'topright',
                topText: '',
                css: null,
                contentCss: null,
                animate: true,
                tabButton: true,
                tabImage: true,
                shadow: true,
                shadowHidden: true,
                hideDefaulted: false,
                openButton: { text:'Feedback', target:'', cssClass:'' },
                cssPath: 'client/feedbacker/css/feedbacker.css',
                submitUrl: 'handlers/feedbacker/feedback.ashx',
                jsonp: false,
                onSuccess: null,
                onError: null,
                typeList: ['General', 'Inquiry', 'Suggestion', 'Other'], // accepts array of string or key/value literals
                customValues: {}, // key/value pairs of values that will be included in every request 
                appName: '',
                fields: [
                    { id:'Firstname', type:'text', label:'First Name' },
                    { id:'Lastname', type:'text', label:'Last Name' },
                    { id:'Email', type:'text', label:'Email Address', required:true },
                    { id:'Type', type:'list', label:'Type of Feedback', list:[] },
                    { id:'Comment', type:'longtext', label:'Comments', required:true }
                ]
            }, options);
        
        var $container,
            $content,
            $openButton;
        
        function _validateForm() {
            var valid = true;
            $.each(_options.fields, function(i, field) {
                if(field.required) {
                    var ctrlId = '#' + _options.id + '-' + field.id;
                    var $ctrl = $(ctrlId, $content);
                    if(!$ctrl.val()) {
                        valid = false;
                        $ctrl.addClass('feedbacker-error').focus();
                        return false;
                    } else {
                        $ctrl.removeClass('feedbacker-error');
                    }
                }
            });
            return valid;
        }
        
        /// <summary>Submit the form submission via AJAX.</summary>
        function _submitForm(dataObj) {
            dataObj._method = 'PUT';
            var ajaxOpts = {
                url: _options.submitUrl,
                data: dataObj,
                type: 'POST',
                dataType: 'json',
                success: function(resp) {
                    if(_options.onSuccess && typeof _options.onSuccess === 'function') {
                        _options.onSuccess.call(_self, resp);
                    }
                    _self.reset();
                },
                error: function(resp) {
                    if(_options.onError && typeof _options.onError === 'function') {
                        _options.onError.call(_self, resp);
                    } else {
                        alert('Error occurred submitting feedback.');
                    }
                }
            };
            if(_options.jsonp) {
                ajaxOpts.type = 'GET'; // jsonp doesn't support POST
                ajaxOpts.dataType = 'jsonp';
                ajaxOpts.jsonp = 'jsonp_callback';
            }
            $.ajax(ajaxOpts);
        }
        
        function _hide(noAnimate) {
            if(_options.tabButton) {
                var changes = {};
                switch(_options.orientation.toLowerCase()) {
                    case 'topright': changes.height = 0; break;
                    case 'topleft': changes.height = 0; break;
                    case 'topcenter': changes.height = 0; break;
                    case 'topfull': changes.height = 0; break;
                    case 'right': changes.width = 0; break;
                    case 'left': changes.width = 0; break; 
                    default: break;
                }
                var buttonHeight = $openButton.outerHeight() + $openButton.position().top; // probably needs marginTop too
                if(_options.animate && !noAnimate) {
                    $content.animate(changes, 'fast', function() {
                        $container.css({ height:buttonHeight, width:0 });
                        $content.hide();
                    });
                } else {
                    $content.css(changes);
                    $container.css({ height:buttonHeight, width:0 });
                    $content.hide();
                }
            } else {
                $container.hide();
            }
            $container.removeClass('feedbacker-float-open');
            if(_options.shadow && _options.shadowHidden) {
                $content.removeClass('feedbacker-content-shadow');
            }
        }
        
        function _show(height, width) {
            if(_options.tabButton) {
                var changes = {};
                switch(_options.orientation.toLowerCase()) {
                    case 'topright': changes.height = height + 'px'; break;
                    case 'topleft': changes.height = height + 'px'; break;
                    case 'topcenter': changes.height = height + 'px'; break;
                    case 'topfull': changes.height = height + 'px'; break;
                    case 'right': changes.width = width + 'px'; break;
                    case 'left': changes.width = width + 'px';break;
                    default: break;
                }
                if(_options.animate) {
                    $container.css({ height:'auto', width:'auto' });
                    $content.show();
                    $content.animate(changes, 'fast');
                } else {
                    $container.css({ height:'auto', width:'auto' });
                    $content.show();
                    $content.css(changes);
                }
            } else {
                $container.show();
            }
            $container.addClass('feedbacker-float-open');
            if(_options.shadow && _options.shadowHidden) {
                $content.addClass('feedbacker-content-shadow');
            }
        }
        
        /// <summary>Helper function to convert a javascript array to an HTML option set</summary>
        function _arrayToOptions(arr) {
            var opts = '';
            if(arr && $.isArray(arr)) {
                var val, name;
                $.each(arr, function(i, item) {
                    // reset to ensure previous value isn't used
                    val = ''; name = ''; 
                    if(typeof item === 'string') { // if string, value will be used for both text and value
                        val = item;
                        name = item;
                    } else if($.isArray(item)) { // if array, first value will be value and second will be text
                        val = item[0];
                        name = item[1];
                    } else { // if object literal, pull properties directly
                        val = item.value;
                        name = item.name;
                    }
                    if(val && name) { // make sure a value was actually pulled off data
                        opts += '<option value="' + val + '">' + name + '</option>';
                    }
                });
            }
            return opts;
        }
        
        /// <summary>Construct the feedback form markup and events.</summary>
        function _buildForm() {
            $container = $('<div id="' + _options.id + '" class="feedbacker"></div>').appendTo(_options.target);
            $content = $('<div class="feedbacker-content"></div>').appendTo($container);
            var $showHide = $container;
            
            if(_options.css) {
                $container.css(_options.css);
            }
            
            if(_options.shadow) {
                $content.addClass('feedbacker-content-shadow');
            }
            
            if(_options.contentCss) {
                $content.css(_options.contentCss);
            }
            
            var contentHeight = 0,
                contentWidth = 0;
			
            if(_options.display === 'float') {
                $container.addClass('feedbacker-float feedbacker-float-open');
                if(_options.target !== 'body') {
                    var targetPos = $(_options.target).css('position');
                    if(targetPos !== 'relative' && targetPos !== 'absolute') {
                        $(_options.target).css('position', 'relative');
                    }
                }
                
                var paddingDirection = 'paddingLeft';                
                
                switch(_options.orientation.toLowerCase()) {
                    case 'topright': $container.addClass('feedbacker-floatTopRight'); break;
                    case 'topleft': $container.addClass('feedbacker-floatTopLeft'); break;
                    case 'topcenter': $container.addClass('feedbacker-floatTopCenter'); break;
                    case 'topfull': $container.addClass('feedbacker-floatTopFull'); break;
                    case 'right': $container.addClass('feedbacker-floatRight'); break;
                    case 'left': 
                            // On left floats, we need the padding for the button on the right side
                            $container.addClass('feedbacker-floatLeft'); 
                            paddingDirection = 'paddingRight';
                            break;
                    default: break;
                }
                
                if(_options.openButton) {
                    var openTarget = _options.openButton.target || _options.target;
                    if(typeof _options.openButton === 'string') {
                        $openButton = $(_options.openButton);
                    } else if (_options.openButton.target) {
                        $openButton = $('<span class="feedbacker-openbutton">' + _options.openButton.text + '</span>').appendTo(openTarget);
                        if(_options.openButton.cssClass) {
                            $openButton.addClass(_options.openButton.cssClass);
                        }
                    } else if(_options.tabButton) {
                        $openButton = $('<div class="feedbacker-openbutton feedbacker-openbutton-tab">' + 
                                '<strong>' + _options.openButton.text + '</strong>' + 
                            '</div>').appendTo($container);
                        if(_options.tabImage) {
                            $openButton.addClass('feedbacker-openbutton-imgtab');
                        }
                        $container.css(paddingDirection, ($openButton.width() + 4) + 'px');
                            
                        $showHide = $content;
                        if(_options.openButton.cssClass) {
                            $openButton.addClass(_options.openButton.cssClass);
                        }
                    } else { // assume jQuery object
                        $openButton = _options.openButton;
                    }
                    $openButton.click(function() {
                        if($container.hasClass('feedbacker-float-open')) {
                            _hide();
                        } else {
                            _show(contentHeight, contentWidth);
                        }
                    });
                }
            }
            
            if(_options.topText) {
                $('<span/>').appendTo($content).append(_options.topText);
            }
            
            var $list = $('<ul class="feedbacker-list feedbacker-fieldlist"></ul>').appendTo($content);
        
            var ctrlId, $li, $label, $control, anyRequired;
            $.each(_options.fields, function(i, field) {
                var val = field.defaultVal || '';
                if(_options.hideDefaulted && val) {
                    field.type = 'hidden';
                }
                
                ctrlId = _options.id + '-' + field.id;
                $li = $('<li class="feedbacker-field"></li>').appendTo($list);
                $label = $('<label for="' + ctrlId + '">' + field.label + '</label>').appendTo($li);
                if(field.required) {
                    $label.append('<span class="feedbacker-required">*</span>');
                    anyRequired = true;
                }
                switch(field.type) {
                    case 'yesno':
                        break;
                    case 'longtext':
                        $control = $('<textarea id="' + ctrlId + '" name="' + ctrlId + '" class="feedbacker-textinput feedbacker-biginput"></textarea>')
                            .appendTo($li)
                            .val(val);
                        break;
                    case 'list':
                        var options = _arrayToOptions(field.list);
                        $control = $('<select id="' + ctrlId + '" name="' + ctrlId + '" class="feedbacker-listinput"></select>')
                            .appendTo($li)
                            .append(options)
                            .val(val);
                        break;
                    case 'hidden':
                        $control = $('<input id="' + ctrlId + '" name="' + ctrlId + '" type="hidden" />')
                            .appendTo($li)
                            .val(val);
                        $li.hide();
                        break;
                    default:
                        $control = $('<input id="' + ctrlId + '" name="' + ctrlId + '" type="text" class="feedbacker-textinput" />')
                            .appendTo($li)
                            .val(val);
                        break;
                }
            });
            
            contentHeight = $content.outerHeight();
            contentWidth = $content.outerWidth();
            
            if(_options.display === 'float' && _options.openButton) {
                _hide(true);
            }
            
            if(anyRequired) {
                $('<span class="feedbacker-required">* = Required</span>').appendTo($content);
            }
            
            var $buttons = $('<div class="feedbacker-buttons"></div>').appendTo($content);
            
            // Cancel button
            // there may be cases in which we want a "cancel" button for inline forms (e.g. bind to a redirect), but for now, just going to leave it out
            if(_options.display === 'float') {
                $('<button class="feedbacker-button">Cancel</button>')
                    .appendTo($buttons)
                    .click(function() {
                        _hide();
                        $('.feedbacker-error', $content).removeClass('feedbacker-error');
                        return false;
                    });
            }
            
            // Submit button
            $('<button class="feedbacker-button">Submit</button>')
                .appendTo($buttons)
                .click(function() {
                    if(_validateForm()) {
                        var feedbackObj = $.extend({ appName:_options.appName }, _options.customValues);
                        $.each(_options.fields, function(i, field) {
                            var ctrlId = '#' + _options.id + '-' + field.id;
                            var val = $(ctrlId, $content).val();
                            feedbackObj[field.id] = val;
                        });
                        
                        _submitForm(feedbackObj);
                        
                        if(_options.display === 'float') {
                            _hide();
                        }
                    }
                    return false;
                });
        }
        
        /// <summary>Add feedbacker CSS file if it doesn't already exist</summary>
        function _addCSS() {
			var head = document.getElementsByTagName("head")[0] || document.documentElement;
			
			// Refactoring - check if the style link already exists, otherwise you end up with
			//  two.  Also, if you only use this one - be aware of unexpected rendering since the
			//  elements may not have their stlyes applied by the time the js is executing on them.
			if ($('link[href*="feedbacker.css"]', head).length === 0 && _options.cssPath){
			    var link = document.createElement('link');
			    link.setAttribute('type', 'text/css');
			    link.setAttribute('rel', 'stylesheet');
			    link.setAttribute('class', 'feedbacker-theme');
			    link.href = _options.cssPath;
			
			    head.insertBefore(link, head.firstChild);
			 }
        }
        
        _self.reset = function() {
            var ctrlId;
            $.each(_options.fields, function(i, field) {
                ctrlId = _options.id + '-' + field.id;
                var val = field.defaultVal || '';
                $('#' + ctrlId).val(val);
            });
        };
		
		_self.addCSS = function () {
			_addCSS();
		};
        
        // Initialize!
        _self.init = function() {	
			if(_options.typeList.length) {
				$.each(_options.fields, function(i, field) {
					if(field.id.toLowerCase() === 'type' && field.type === 'list') {
						if(!field.list || (field.list && $.isArray(field.list) && field.list.length === 0)) {
							field.list = _options.typeList;
						}
					}
				});
			}
		
			_buildForm();
            
            // not returning _self here, because the static public init will always manually call this init.
        };
        
        return _self;
    };

    /// <summary>Create public entry point for a new Feedbacker form.</summary>
    fbkr.init = function(options) {
        var instance = _main(options);
		instance.addCSS();
        
        $(document).ready(function() {
            instance.init();
        });
    };
}(Feedbacker, jQuery));