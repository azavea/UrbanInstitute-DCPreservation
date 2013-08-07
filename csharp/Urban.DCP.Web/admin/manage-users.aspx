<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="manage-users.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Furman.PDP.Web.admin.ManageUsers" %>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Furman.PDP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
     <h2 id="pdp-profile-header">User Administration</h2>
     <div id="pdp-main">
         <div id="pdp-pdb-table-content" style="display:block;">
            <div id="pdp-admin-user-table"></div>
            <div id="pdp-user-table-pager" class="pdp-user-table-pager"></div>
        </div>

    </div>   
    
    <div id="pdp-form-dialog" title="Edit User Data">

        <h2>User Profile</h2>
        <fieldset class="pdp-form">
            <ul class="pdp-form-list">
                <li>
                    <label for="pdp-username" class="pdp-form-label">Username</label>
                    <div class="pdp-form-ctrl">
                        <input id="pdp-username" type="text" class="pdp-input pdp-input-text" readonly="readonly" />
                    </div>
                </li>
                </li>
                <li>
                    <label for="pdp-name" class="pdp-form-label">Name</label>
                    <div class="pdp-form-ctrl">
                        <input id="pdp-name" type="text" class="pdp-input pdp-input-text" tabindex="1" />
                    </div>
                </li>
                <li>
                    <label for="pdp-email" class="pdp-form-label">Email</label>
                    <div class="pdp-form-ctrl">
                        <input id="pdp-email" type="text" class="pdp-input pdp-input-text" tabindex="2" />
                    </div>
                </li>
                <input id="pdp-change-password" type="checkbox" tabindex="3" class="pdp-input" />
                <label for="pdp-change-password" class="pdp-form-list-label">Change Password</label>
                <div id="pdp-password-container">
                    <ul class="pdp-form-list">
                        <li>
                            <label for="pdp-password" class="pdp-form-label">Password</label>
                            <div class="pdp-form-ctrl">
                                <input id="pdp-password" type="password" class="pdp-input pdp-input-text" tabindex="4" />
                            </div>
                        </li>
                        <li>
                            <label for="pdp-password-2" class="pdp-form-label">Confirm Password</label>
                            <div class="pdp-form-ctrl">
                                <input id="pdp-password-2" type="password" class="pdp-input pdp-input-text" tabindex="5" />
                            </div>
                        </li>
                    </ul>
                </div>
                <fieldset class="pdp-form">
                    <legend>User Privileges</legend>
                    <li>
                        <label for="pdp-role-public" class="pdp-form-label">Public</label>
                        <div class="pdp-form-ctrl">
                            <input id="pdp-role-public" type="checkbox" value="public" class="pdp-input pdp-input-checkbox pdp-role-input" tabindex="6" />
                        </div>
                    </li>
                    <li>
                        <label for="pdp-role-limited" class="pdp-form-label">Limited</label>
                        <div class="pdp-form-ctrl">
                            <input id="pdp-role-limited" type="checkbox" value="limited" class="pdp-input pdp-input-checkbox pdp-role-input" tabindex="7" />
                        </div>
                    </li>
                    <li>
                        <label for="pdp-role-sysadmin" class="pdp-form-label">SysAdmin</label>
                        <div class="pdp-form-ctrl">
                            <input id="pdp-role-sysadmin" type="checkbox" value="SysAdmin" class="pdp-input pdp-input-checkbox pdp-role-input" tabindex="8" />
                        </div>
                    </li>
                </fieldset>
            </ul>
	    
    </div>


    <script type="text/javascript">
        PDP.ManageUsers({ 
            target:'#content',
            tableTarget:'#pdp-admin-user-table',
            pagerTarget:'#pdp-user-table-pager',
            dialogTarget:'#pdp-form-dialog',
            appUrl: '<%=WebUtil.GetApplicationUrl(Request) %>'
        }).init();
    </script>
    
</asp:Content>