(function(P) {
    P.ManageUsers = function(options) {
        var _self = {
            orgMap: {}
        },
            _options = $.extend({
                target: 'body',
                bindTo: P,
                fields: [
                    { id:'name', required:true },
                    { id: 'email', required: true, validator: 'email' },
                    { id:'password', required:true, type:'password', validator:'password' },
                    { id: 'password-2', required: true, type: 'password' }
                ]
            }, options);
        
        // Display error message on the page
        var _displayErrorMsg = Azavea.tryCatch('display error message', function(msg) {
            $('<span class="pdp-form-messages ui-state-error">' + msg + '</span>').prependTo(_options.target);
        });
        
        // Setup error message for the dialog
        var _displayDialogErrorMsg = Azavea.tryCatch('display dialog error message', function(msg) {
            $('<span class="pdp-form-messages ui-state-error">' + msg + '</span>').prependTo(_options.dialogTarget);
        });
        
        // Handles requests for table widget user data		         
        var _getUserData = Azavea.tryCatch('load user data', function(page, pageSize, sortIndex, sortAsc) {
            
            // Get the data with the specified parameters
            P.Data.getUsers(page, pageSize, sortIndex, sortAsc,                    
                    function(data) {
                        data.ExtraAttrs = [
                            { Name: 'Edit', ValType: 'userEdit' }
                        ];
                        $(_options.bindTo).trigger('pdp-data-response', [ data ]);

                    });
        });
        
        // Returns a comma seperated list of roles that are checked on the dialog
        var _getSelectedRoles = Azavea.tryCatch('get selected roles', function () {
            var retValue = "";
            
            // Loop through the checked role checkboxes
            $('.pdp-role-input:checked').each(function(index){
                retValue += $(this).val() + ',';
            });
     
            // Logical comma       
            if (retValue !== ""){
                retValue = retValue.substr(0, retValue.length - 1);
            }
            
            return retValue;
        });
        
        // Show/hide div container around password elements
        var _togglePasswordElements = Azavea.tryCatch('toggle password elements', function() {
            $('#pdp-password-container').toggle(this.checked);
        });
        
        // Update the user details from the current dialog form
        var _updateUser = Azavea.tryCatch('update user details', function(event) {
            // event.target has the save button
            if(!$(event.target).hasClass('pdp-input-button-disabled')) {
                $('.pdp-form-messages').remove();
                
                // Disable from clicking twice
                $(event.target).addClass('pdp-input-button-disabled');
                
                // Validate our few fields
                if (P.Form.validate(_options.fields, {}, _options.target, P.prefix)) {
                    var username = $('#pdp-username').val(),
                        password = $('#pdp-password').val(),
                        name = $('#pdp-name').val(),
                        email = $('#pdp-email').val(),
                        roles = _getSelectedRoles(),
                        organization = $("#pdp-select-org").val(),
                        active = $("#pdp-active").is(":checked"),
                        aff = $('#pdp-affiliation').val(),
                        confirmed = $('#pdp-email-confirm').is(':checked');
                    
                    // Send the data to be updated
                    P.Data.updateUser(username, name, email, password, roles,
                        organization, active, confirmed, aff, function () {
                            //Success - Reload the user table
                            $(_options.bindTo).trigger('pdp-data-force-update');
                            
                            P.Util.quickAlert('User profile has been updated.');
                            
                            // Re-enable the update button
                            $(event.target).removeClass('pdp-input-button-disabled');
                            
                            // Close the dialog
                            $(_options.dialogTarget).dialog('close');
                            
                        }, function(respText) {
                            // Failure
                            _displayErrorMsg(respText);
                        });
                } else {
                    _displayDialogErrorMsg('All fields are required.  Passwords must be at least 8 characters long.');
                    $('.pdp-input-invalid:first').focus();
                }
            }                
        });
        
        // For ExtraCol "Edit" configure link click to display dialog with user info for edit.
        var _overrideRenderer = Azavea.tryCatch('override edit renderer', function() {

            P.Util.renderers.organization = function(value) {
                return _self.orgMap[value];
            };

            P.Util.renderers.userEdit = function (value, index, record, attrs) {
                
                $('#pdp-edit-user-' + index).live('click', function(event) {
                    var rolesIdx = -1;
                    var organizationIdx = -1;
                    
                    // Clear form fields
                    $('.pdp-input', '#pdp-form').val('');
                    $('#pdp-change-password').attr('checked', false);
                    $('#pdp-password-container').hide();
                    $('.pdp-role-input:checked').attr('checked', false);
                    
                    // Figure out which index is for which field, and populate.  This could 
                    //  change if the metadata returned with the results changed.
                    var i;
                    for(i=0;i<attrs.length;i++) {
                        switch(attrs[i].UID) {
                            case 'UserName':
                                $('#pdp-username').val(record[i]);
                                break;
                            case 'Name':
                                $('#pdp-name').val(record[i]);
                                break;
                            case 'Email':
                                $('#pdp-email').val(record[i]);
                                break;
                            case 'Roles':
                                rolesIdx = i;
                                break;
                            case 'Organization':
                                $("#pdp-select-org").val(record[i]);
                                break;
                            case 'Active':
                                $('#pdp-active').prop('checked', record[i]);
                                break;
                            case 'EmailConfirmed':
                                $('#pdp-email-confirm').prop('checked', record[i]);
                                break;
                            case 'Affiliation':
                                $('#pdp-affiliation').val(record[i]);
                                break;
                            case 'NetworkRequested':
                                $('#pdp-requesting').prop('checked', record[i]);
                                break;
                            default:
                                Azavea.log('An unknown user field was not accounted for: [' + attrs[i].UID + ']');
                                break;                              
                        }
                    }
                    
                    // Only if we found the roles metadata.  If not, there's a problem and we shouldn't
                    //  let anyone edit this record.
                    if (rolesIdx !== -1){                   
                        var roles = record[rolesIdx].split(",");
                        
                        // Loop through the roles, and check the corresponding box
                        $.each(roles, function (i, role){
                            switch(role){
                                case 'public':
                                    $('#pdp-role-public').attr('checked', true);
                                    break;
                                case 'limited':
                                    $('#pdp-role-limited').attr('checked', true);
                                    break;
                                case 'SysAdmin':
                                    $('#pdp-role-sysadmin').attr('checked', true);
                                    break;
                                default:
                                    Azavea.log('An unknown user role was not accounted for: [' + role + ']');  
                                    break;
                            }
                        });
                        
                        // Open our edit dialog
                        $(_options.dialogTarget).dialog('open');
                    
                    } else {
                        Azavea.log('Could not find the roles metadata, not allowing editing');
                        _displayErrorMsg('Could not edit user.');
                    }
                });
                return '<a id="pdp-edit-user-' + index + '" href="javascript:void(0);">Edit</a>';

            };
        });
        
        function _renderOrganizationSelect(data) {
            var $select = $("#pdp-select-org").empty();
            var optionTemplate = "<option value='{{id}}'>{{org_name}}</option>";
            var NO_ORG = 0;
            data.unshift({ "Id": NO_ORG, "Name": "no organization" });
            _.each(data, function (org) {
                $select.append(optionTemplate.replace("{{id}}", org.Id)
                                             .replace("{{org_name}}", org.Name));
            });
        }
        
        // Initialization routines for user admin page
        _self.init = Azavea.tryCatch('init profile', function() {
            $.ajaxSetup({
                cache: false
            });

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
            
            // Let any page elements know current logged in status
            P.Util.initLoginStatus();  
            
            // Override any column renderer for this data type
            _overrideRenderer();

            // Uncheck change password ckbox, hide password elements
            $('#pdp-change-password').attr('checked', false);
            _togglePasswordElements();
            
            // Binding to show password fields only if the checkbox is selected
            $('#pdp-change-password').change(_togglePasswordElements);
            
            // Configure the dialog that will be used for editing
            $(_options.dialogTarget).dialog({
                autoOpen: false,
                resizable: false,
                height: 500,
                width: 400,
                modal: true,
                buttons: {
                    'Save': _updateUser,
                    Cancel: function() {
                        $(this).dialog('close');
                    }},
                close: function() {
                }
            });
            
            // Bind to the table widget data request event
            $(_options.bindTo).bind('pdp-data-request', function(event, page, pageSize, colIndex, sortAsc) {
                _getUserData(page, pageSize, colIndex, sortAsc);
            });

            // Enable the table widget for this page
            P.Widget.Table({
                target: _options.tableTarget,
                pagerTarget: _options.pagerTarget,
                bindTo: _options.bindTo
            }).init();
            
            // Initiate a data request for users
            P.Data.getOrganizations(
                function callback(data) {
                    _renderOrganizationSelect(data);
                    _.map(data, function (org) {
                        _self.orgMap[org.Id] = org.Name;
                    });
                    $(_options.bindTo).trigger('pdp-data-force-update');
                },
                function errback() {
                    P.Util.alert("There was an error fetching organizations.", "Error");
                }
            );

            return _self;
        });
        
        return _self;
    };
}(PDP));