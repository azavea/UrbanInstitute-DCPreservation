(function(P) {
    P.ManageUsers = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                fields: [
                    { id:'name', required:true },
                    { id:'email', required:true, validator:'email' },
                    { id:'password', required:true, type:'password', validator:'password' },
                    { id:'password-2', required:true, type:'password' }
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
        var _getSelectedRoles = Azavea.tryCatch('get selected roles', function(){
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
                if(P.Form.validate(_options.fields, {}, _options.target, P.prefix)) {
                    var username = $('#pdp-username').val(),
                        password = $('#pdp-password').val(),
                        name = $('#pdp-name').val(),
                        email = $('#pdp-email').val();
                        roles = _getSelectedRoles();
                        
                    // Send the data to be updated
                    P.Data.updateUser( username, name, email, password, roles, function() {
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
                    _displayDialogErrorMsg('All fields are required.');
                    $('.pdp-input-invalid:first').focus();
                }
            }                
        });
        
        // For ExtraCol "Edit" configure link click to display dialog with user info for edit.
        var _overrideRenderer = Azavea.tryCatch('override edit renderer', function(){
            P.Util.renderers.userEdit = function(value, index, record, attrs) {
                
                $('#pdp-edit-user-' + index).live('click', function(event) {
                    var rolesIdx = -1;
                        
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
        
        
        // Initialization routines for user admin page
        _self.init = Azavea.tryCatch('init profile', function() {
            
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
            $(_options.bindTo).trigger('pdp-data-force-update');
            
            return _self;
        });
        
        return _self;
    };
}(PDP));