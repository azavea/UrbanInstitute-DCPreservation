<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="signup.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Furman.PDP.Web.Signup" %>
<%@ MasterType TypeName="Furman.PDP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
    <h2>Sign Up</h2>
    <fieldset class="pdp-form">
        <ul class="pdp-form-list">
            <li>
                <label for="pdp-username" class="pdp-form-label">User Name</label>
                <div class="pdp-form-ctrl">
                    <input id="pdp-username" type="text" class="pdp-input pdp-input-text" tabindex="1" />
                </div>
            </li>
            <li>
                <label for="pdp-name" class="pdp-form-label">Name</label>
                <div class="pdp-form-ctrl">
                    <input id="pdp-name" type="text" class="pdp-input pdp-input-text" tabindex="2" />
                </div>
            </li>
            <li>
                <label for="pdp-email" class="pdp-form-label">Email</label>
                <div class="pdp-form-ctrl">
                    <input id="pdp-email" type="text" class="pdp-input pdp-input-text" tabindex="3" />
                </div>
            </li>
        </ul>
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

        <div class="pdp-form-buttons">
            <input type="button" id="pdp-signup-button" value="Sign Up" class="pdp-input pdp-input-button" tabindex="6" />
        </div>
    </fieldset>
    
    <script type="text/javascript">
        PDP.Signup({ target:'#content' }).init();
    </script>
    
</asp:Content>