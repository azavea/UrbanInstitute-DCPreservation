(function (P) {
    var _renderArray = Azavea.tryCatch('render an array', function(array, renderer) {
        var content;
        if (array && array.length) {
            content = '<ul class="pdp-rendered-list">';
            $.each(array, function(i, val) {
                content += '<li>' + renderer(val) + '</li>';
            });
            content += '</ul>';
        }
        
        return content;
    });
    
    P.StringBuffer = function() { 
           this.buffer = []; 
         }; 

         P.StringBuffer.prototype.append = function append(string) { 
           this.buffer.push(string);  
         }; 

         P.StringBuffer.prototype.toString = function toString() { 
           return this.buffer.join(""); 
    }; 
    
    P.Util = {
        prefix: Azavea.tryCatch('add prefix', function(prefix, word) {
            if (prefix) {
                return prefix + word;
            } else {
                return word;
            }
        }),
        
        renderers: {
            integer: function(val) {
                if ($.isArray(val)) {
                    return _renderArray(val, P.Util.renderers.integer);
                } else {
                    if (val || val === 0) {
                        return parseInt(val, 10).superToString(0);
                    } else {
                        return '[No Value]';
                    }
                }
            },
            money: function(val) {
                if ($.isArray(val)) {
                    return _renderArray(val, Azavea.renderers.money);
                } else {
                    if (val || val === 0) {
                        return Azavea.renderers.money(parseFloat(val), true);
                    } else {
                        return '[No Value]';
                    }
                }
            },
            text: function(val) {
                if ($.isArray(val)) {
                    return _renderArray(val, P.Util.renderers.text);
                } else {
                    if (val && typeof(val) === 'string') {
                        return val.trim();
                    } else {
                        return '[No Value]';
                    }
                }
            },
            numericText: function(val){
                if ($.isArray(val)) {
                    return _renderArray(val, P.Util.renderers.numericText);
                } else {
                    if (val) {
                        return val.toString().trim();
                    } else {
                        return '[No Value]';
                    }
                }                
            },
            address: function(val) {
                return P.Util.renderers.text(val);
            },
            year: function(val) {
                return P.Util.renderers.numericText(val);
            },
            count: function(val){
                return P.Util.renderers.integer(val);
            },
            percent: function(val) {
                if ($.isArray(val)) {
                    return _renderArray(val, P.Util.renderers.percent);
                } else {
                    if (val || val === 0) {
                        return val.toFixed(2).toString() + '%';
                    } else {
                        return '[No Value]';
                    }
                } 
            },
            dollars: function(val){
                return P.Util.renderers.money(val);
            },
            ratio: function(val){
                if ($.isArray(val)) {
                    return _renderArray(val, P.Util.renderers.ratio);
                } else {
                    if (val || val === 0) {
                        return val.toFixed(2).toString();
                    } else {
                        return '[No Value]';
                    }
                } 
                
            },
            sliderTicks: function($slider, ticksArray) {
                var i, 
                    left,
                    len = ticksArray.length;
                    
                //Remove any current gaps
                $('.pdp-nychanis-slider-tick', $slider).remove();

                for(i=0; i<ticksArray.length; i++) {
                    if (ticksArray[i]) {
                        // Don't divide by 0!
                        if (len === 1){
                            left = 0;
                        }
                        else{
                            left = (i / (len-1)) * 100;
                        }
                    
                        //Give the gap a helpful tooltip
                        $('<div class="pdp-nychanis-slider-tick" title="'+ ticksArray[i] +'"></div>')
                            .css({
                                'left': left + '%'
                            })
                            .appendTo($slider);
                    }
                }
            }         
        },
        
        getAttrIndex: function(attrs, name) {
            var i;
            for (i=0; i<attrs.length; i++) {
                if (attrs[i].UID === name) {
                    return i;
                }
            }
        },
        
        alert: function(message, title) {
            $('<div>' + message + '</div>').dialog({
			    modal: true,
			    title: title,
			    buttons: {
				    Ok: function() {
					    $(this).dialog('close');
				    }
			    }
		    });
        },
        error: function(error) {
            PDP.Util.alert(error);
        },
        quickAlert: function(message, title) {
            var $qa = $('<div class="pdp-quickalert ui-widget-header ui-corner-bottom pdp-shadow-drop">' + message + '</div>')
                .appendTo('body');
            
            $qa.slideDown(function(){
                setTimeout(function() {
                    $qa.slideUp(function() {
                        $qa.remove();
                    });
                }, 2500);
            });
        },
        quickError: function(message) {
            PDP.Util.quickAlert(message);
        },
        // Check the current login status and broadcast it so we don't have mulitple checks from
        //  various widgets who need to know
        initLoginStatus: function(){
            // Check the login status
            P.Data.checkLoginStatus(function(user) {
                $(P).trigger('pdp-login-status-refresh', [user]);
            }, 
            function(){
                // On error, we assume we are NOT loged in, pass something falsey
                $(P).trigger('pdp-login-status-refresh', [false]);
            });
        },
        trackMetric: function(category, action, label, value){
            _gaq.push(['_trackEvent', category, action, label, value]);
        }
    };
}(PDP));