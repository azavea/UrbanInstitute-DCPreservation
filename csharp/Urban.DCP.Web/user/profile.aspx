<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="profile.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Furman.PDP.Web.user.Profile" %>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Furman.PDP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
    <h2 id="pdp-profile-header">Your Profile</h2>
    <div class="pdp-form">
        <fieldset class="pdp-profile-form" >
            <div class="pdp-form-message">Use this form to update your basic account information.</div>
            <ul class="pdp-form-list">
                <li>
                    <label for="pdp-name" class="pdp-form-label">Name:</label>
                    <div class="pdp-form-ctrl">
                        <input id="pdp-name" type="text" class="pdp-input pdp-input-text" tabindex="2" />
                    </div>
                </li>
                <li>
                    <label for="pdp-email" class="pdp-form-label">Email:</label>
                    <div class="pdp-form-ctrl">
                        <input id="pdp-email" type="text" class="pdp-input pdp-input-text" tabindex="3" />
                    </div>
                </li>
                <li>
                    <input id="pdp-change-password" type="checkbox" tabindex="4" class="pdp-input-checkbox" />
                    <label for="pdp-change-password" class="pdp-form-list-label">Change Password</label>
                    <div id="pdp-password-container">
                        <ul class="pdp-form-list">
                            <li>
                                <label for="pdp-password" class="pdp-form-label">Password:</label>
                                <div class="pdp-form-ctrl">
                                    <input id="pdp-password" type="password" class="pdp-input pdp-input-text" tabindex="5" />
                                </div>
                            </li>
                            <li>
                                <label for="pdp-password-2" class="pdp-form-label">Confirm Password:</label>
                                <div class="pdp-form-ctrl">
                                    <input id="pdp-password-2" type="password" class="pdp-input pdp-input-text" tabindex="6" />
                                </div>
                            </li>
                        </ul>
                    </div>

                </li>
            </ul>
            <div class="pdp-form-buttons">
                <button id="pdp-update-button" class="pdp-button" value="Update" tabindex="7">Update</button>
            </div>
        </fieldset>
    </div>
    <script type="text/javascript">
        PDP.Profile({ 
            target:'#content',
            userName: '<%= HttpContext.Current.User.Identity.Name %>',
            appUrl: '<%=WebUtil.GetApplicationUrl(Request) %>'
        }).init();
    </script>
   
</asp:Content>