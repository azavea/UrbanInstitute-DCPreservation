<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Login.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Furman.PDP.Web.Login" %>
<%@ MasterType TypeName="Furman.PDP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
    <h2>Log In</h2>
    <fieldset class="pdp-form">
        <ul>
            <li>
                <label for="username" class="pdp-form-label">Username</label>
                <div class="pdp-form-ctrl">
                    <input id="username" type="text" class="pdp-input pdp-input-text" tabindex="1" />
                </div>
            </li>
            <li>
                <label for="password" class="pdp-form-label">Password</label>
                <div class="pdp-form-ctrl">
                    <input id="password" type="password" class="pdp-input pdp-input-text" tabindex="2" />
                </div>
            </li>
        </ul>

        <div class="pdp-form-buttons">
            <input type="button" id="pdp-login-button" value="Log In" class="pdp-input pdp-input-button pdp-input-button-primary" tabindex="3" />
        </div>
    </fieldset>
    
    <h2>Reset Password</h2>
    <fieldset class="pdp-form">
        <ul>
            <li>
                <label for="pdp-reset-password-username" class="pdp-form-label">Username</label>
                <div class="pdp-form-ctrl">
                    <input id="pdp-reset-password-username" type="text" class="pdp-input pdp-input-text" tabindex="4" />
                </div>
            </li>
        </ul>

        <div class="pdp-form-buttons">
            <input type="button" id="pdp-reset-password-button" value="Reset Password" class="pdp-input pdp-input-button pdp-input-button-primary" tabindex="5" />
        </div>
    </fieldset>
    
    <script type="text/javascript">
        PDP.Login({ target:'#content' }).init();
    </script>
    
</asp:Content>