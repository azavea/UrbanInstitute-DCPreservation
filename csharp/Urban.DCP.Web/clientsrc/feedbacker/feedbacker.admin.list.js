(function (fbkr) {
    fbkr.AdminList = function(options) {
        var _self = {},
            _options = $.extend({
                id: 'feedbacker-admin-list',
                target: 'body',
                resourcePath: 'handlers/feedbacker/',
                feedbackUrl: 'feedback.ashx',
                authToken: '',
                limit: 20,
                feedbackTypes: ['All Types', 'General', 'Inquiry', 'Suggestion', 'Other'],
                appNames: []
            }, options),
            _manager,
            _filters = { sort:'date', sortDir:'desc' };
        
        var $container,
            $filters,
            $actions,
            $count,
            $list;
            
        var _renderers = {
            date: function(val, feedback) {
                if (val && val.getDate) { return (val.getMonth() + 1) + '/' + val.getDate() + '/' + val.getFullYear(); }
                else { return ''; }
            },
            time: function(val, feedback) {
                if (val && val.getDate) {
                    var mins = val.getMinutes(), hours = val.getHours(), ampm = 'AM';
                    if (mins < 10) { mins = '0' + mins; }
                    if (hours === 0) { hours = 12; }
                    else if (hours >= 12) {
                        if (hours > 12) { hours -= 12; }
                        ampm = 'PM';
                    }
                    return hours + ':' + mins + ' ' + ampm;
                } else {
                    return '';
                }
            },
            datetime: function(val, feedback) {
                return _renderers.date(val) + ' ' + _renderers.time(val);
            },
            user: function(val, feedback) {
                var user = '';
                if(feedback.Post && feedback.Post.Firstname) {
                    user = feedback.Post.Firstname;
                }
                if(feedback.Post && feedback.Post.Lastname) {
                    if(user) { user += ' '; }
                    user += feedback.Post.Lastname;
                }
                return user;
            }
        };
        
        function _renderFilters() {
            var $list = $('<ul></ul>').appendTo($filters);
            
            // text search
            var $textLi = $('<li><label for="' + _options.id + '-filters-text">Text Search</label></li>').appendTo($list);
            var $text = $('<input type="text" id="' + _options.id + '-filters-text" class="feedbacker-textinput" />').appendTo($textLi).keyup(function() {
                var textVal = $(this).val();
                if(textVal && textVal.length > 2) {
                    _filters.text = textVal;
                    _getFeedbacks();
                } else if('text' in _filters) {
                    delete _filters.text;
                    _getFeedbacks();
                }
            });
            
            // type search
            if(_options.feedbackTypes && _options.feedbackTypes.length) {
                var $typeLi = $('<li><label for="' + _options.id + '-filters-type">Feedback Type</label></li>').appendTo($list);
                var $type = $('<select id="' + _options.id + '-filters-type" class="feedbacker-listinput"></select>').appendTo($typeLi).change(function() {
                    var selectedType = $(this).val();
                    if(selectedType) {
                        _filters.type = selectedType;
                    } else if('type' in _filters) {
                        delete _filters.type;
                    }
                    _getFeedbacks();
                });
                $.each(_options.feedbackTypes, function (i, typeName) {
                    $type.append('<option value="' + (i === 0 ? '' : typeName) + '">' + typeName + '</option>');
                });
            }
            
            // application search
            if(_options.appNames && _options.appNames.length) {
                var $appNameLi = $('<li><label for="' + _options.id + '-filters-app">Application</label></li>').appendTo($list);
                var $appName = $('<select id="' + _options.id + '-filters-app" class="feedbacker-listinput"></select>').appendTo($appNameLi).change(function() {
                    var selectedApp = $(this).val();
                    if(selectedApp) {
                        _filters.appName = selectedApp;
                    } else if('appName' in _filters) {
                        delete _filters.appName;
                    }
                    _getFeedbacks();
                });
                $.each(_options.appNames, function (i, appName) {
                    $appName.append('<option value="' + (i === 0 ? '' : appName) + '">' + appName + '</option>');
                });
            }
        }
        
        function _renderActions() {
            function complete() {
                _getFeedbacks();
                $('input', $actions).removeClass('feedbacker-button-hover').attr('disabled', 'disabled');
            }
        
            var $unread = $('<input type="button" class="feedbacker-button" value="Mark as Unread" disabled="disabled" />').appendTo($actions)
                .hover(function() {
                    $(this).addClass('feedbacker-button-hover');
                }, function() {
                    $(this).removeClass('feedbacker-button-hover');
                })
                .click(function() {
                    var ids = [];
                    $('input:checked', $list).each(function() {
                        ids.push( parseInt($(this).attr('rel'), 10) );
                    });
                    var j = ids.length;
                    while(j--) {
                        _updateFeedbackStatus(ids[j], 'New', (j===0 ? complete : null));
                        $('tr[rel=' + ids[j] + ']', $list).addClass('new');
                    }
                });
            
            var $delete = $('<input type="button" class="feedbacker-button" value="Delete" disabled="disabled" />').appendTo($actions)
                .hover(function() {
                    $(this).addClass('feedbacker-button-hover');
                }, function() {
                    $(this).removeClass('feedbacker-button-hover');
                }).click(function() {
                    var ids = [];
                    $('input:checked', $list).each(function() {
                        ids.push( parseInt($(this).attr('rel'), 10) );
                    });
                    if(confirm('Are you sure you want to delete ' + (ids.length === 1 ? 'this entry' : 'these entries') + '?')) {
                        var j = ids.length;
                        while(j--) {
                            _updateFeedbackStatus(ids[j], 'Deleted', (j===0 ? complete : null));
                            $('tr[rel=' + ids[j] + ']', $list).remove();
                        }
                    }
                });
            
            $count = $('<div class="feedbacker-admin-list-count"></div>').appendTo($actions);
        }
        
        function _updateFeedbackStatus(id, status, success) {
            $.ajax({
                url: _options.resourcePath + _options.feedbackUrl,
                data: { token:_options.authToken, Id:id, Status:status },
                dataType: 'json',
                type: 'POST',
                success: function(resp) {
                    if(success && typeof success === 'function') {
                        success();
                    }
                },
                error: function(resp) {
                    _manager.displayMessage('Error saving feedback status.', true);
                    if(window.console) { console.log(resp.responseText); }
                }
            });
        }
        
        function _displayDetail(feedback) {
            $('#' + _options.id + '-detailwin').remove();
        
            var $detail = $('<div id="' + _options.id + '-detailwin" class="feedbacker-admin-detail"></div>').appendTo('body');
            var $close = $('<span class="feedback-admin-detail-close">x</span>').appendTo($detail).click(function () { $detail.remove(); });
            
            var html = '<ul id="' + _options.id + '-details">';
            
            html += '<li class="first"><label>ID</label><span>' + feedback.Id + '</span></li>';
            html += '<li><label>Date</label><span>' + _renderers.datetime(feedback.Stamp, feedback) + '</span></li>';
            html += '<li><label>Status</label><span>' + feedback.Status + '</span></li>';
            
            $.each(feedback.Post, function(p, val) {
                if(val && typeof val === 'object') {
                    var v = '';
                    $.each(val, function(sp, sval) {
                        if(typeof sval !== 'object') {
                            v += '<p>' + sp + ': ' + sval + '</p>';
                        }
                    });
                    val = v;
                }
                html += '<li><label>' + p + '</label><span>' + (val || '&nbsp;') + '</span></li>';
            });
            
            html += '</ul>';
            
            $detail.append(html);
        }
        
        function _renderFeedbackList(feedbacks, count) {
            function renderRows(start, limit) {
                var html = '';
                $.each(feedbacks, function(i, feedback) {
                    if(i < start) { return true; }
                    if(i >= limit) { return false; }
                    var rowClasses = [];
                    if(feedback.Status === 'New') {
                        rowClasses.push('new');
                    }
                    html += '<tr rel="' + i + '" class="' + rowClasses.join(' ') + '">';
                    html += '<td class="first"><input type="checkbox" rel="' + feedback.Id + '" /></td>';
                    html += '<td>' + feedback.Id + '</td>';
                    html += '<td>' + (feedback.AppName || '') + '</td>';
                    html += '<td>' + (feedback.FeedbackType || '&nbsp;') + '</td>';
                    html += '<td class="nowrap">' + _renderers.datetime(feedback.Stamp, feedback) + '</td>';
                    html += '<td>' + _renderers.user('', feedback) + '</td>';
                    html += '<td>' + feedback.Post.Comment + '</td>';
                    html += '</tr>';
                });
                return html;
            }
            
            $count.html('<strong>',count,'</strong> feedback entr',(count == 1 ? 'y' : 'ies'),' were found.');
        
            var html = ['<table>',
                '<thead>',
                    '<tr>',
                        '<th></th>',
                        '<th>ID</th>',
                        '<th><a title="Sort by Application" href="javascript:void(0)" rel="appName">App</a></th>',
                        '<th><a title="Sort by Feedback Type" href="javascript:void(0)" rel="type">Type</a></th>',
                        '<th><a title="Sort by Date" href="javascript:void(0)" rel="date">Date</a></th>',
                        '<th>User</th>',
                        '<th>Comment</th>',
                    '</tr>',
                '</thead>'].join('');
            html += renderRows(0, _options.limit);
            html += '</table>';
            if(count > _options.limit) {
                html += '<div class="feedbacker-admin-list-more">';
                html += '<input type="button" class="feedbacker-button" value="More" />';
                html += '</div>';
            }
            
            $list.empty().html(html);
            
            // sort click
            $('th a', $list).click(function() {
                var sortBy = $(this).attr('rel');
                if(_filters.sort && _filters.sort === sortBy && !_filters.sortDir) {
                    _filters.sortDir = 'desc';
                } else {
                    _filters.sort = sortBy;
                    if('sortDir' in _filters) { delete _filters.sortDir; }
                }
                _getFeedbacks();
            });
            // striping
            $('tr:odd', $list).addClass('alt');
            // row click
            $('tbody td:not(.first)', $list).click(function() {
                var item, $tr = $(this).parent();
                try {
                    var idx = parseInt($tr.attr('rel'), 0);
                    item = feedbacks[idx];
                } catch(e) {
                    return;
                }
                
                // have to check tr instead of item here in case the status was altered by "Mark as Unread" and data is out of date.
                if(item && $tr.hasClass('new')) {
                    _updateFeedbackStatus(item.Id, 'Viewed', function () {
                        item.Status = 'Viewed';
                        $tr.removeClass('new');
                    });
                }
                if(item) {
                    _displayDetail(item);
                }
            });
            var count = 0; // it's not a hash, but easy to look up and order doesn't matter
            $('input:check', $list).click(function() {
                count += $(this).is(':checked') ? 1 : -1;
                if(count === 0) {
                    $('input', $actions).attr('disabled', 'disabled');
                } else if(count === 1) {
                    $('input', $actions).removeAttr('disabled');
                }
            });
            // "paging"
            var start = 0, limit = _options.limit;
            $('.feedbacker-admin-list-more input', $list).click(function() {
                start += _options.limit;
                limit += _options.limit;
                $('table', $list).append(renderRows(start, limit));
                if(limit >= count) {
                    $(this).remove();
                }
            });
        }
        
        function _getFeedbacks() {
            $.ajax({
                url: _options.resourcePath + _options.feedbackUrl,
                data: _filters,
                dataType: 'json',
                type: 'GET',
                success: function(resp) {
                    if(resp.feedbacks && resp.feedbacks.length) {
                        _renderFeedbackList(resp.feedbacks, resp.count);
                    } else {
                        $list.html('<p>There are no Feedback entries to display.</p>');
                    }
                },
                error: function(resp) {
                    $container.html('<p class="feedbacker-error">' + resp.responseText + '</p>');
                }
            });
        }

        _self.load = function() {
            $container = $('<div id="' + _options.id + '"></div>').appendTo(_options.target);
            $filters = $('<div id="' + _options.id + '-filters" class="feedbacker-admin-list-filters"></div>').appendTo($container);
            $actions = $('<div id="' + _options.id + '-actions" class="feedbacker-admin-list-actions"></div>').appendTo($container);
            $list = $('<div id="' + _options.id + '-list"></div>').appendTo($container);
        
            $list.html('Loading feedback ...');
            
            _renderFilters();
            _renderActions();
            
            _getFeedbacks();
        };

        _self.init = function (manager) {
            _manager = manager;
            
            _filters.token = _options.authToken;
            
            $(_options.target).addClass('feedbacker-adminlist');
            
            return _self;
        };
        
        return _self;
    };
})(Feedbacker);