<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="confirmEmail.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Urban.DCP.Web.ConfirmEmailPage"  %>
<%@ MasterType TypeName="Urban.DCP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
    <h3>User signup email confirmation</h3>
    <div class="center">
         <%
            Response.Write(ConfirmEmail(
                Request.QueryString.Get("username"),
                Request.QueryString.Get("token")
               ));
         %>
        <br /><br />
        <a href="default.aspx">Return To Main Page</a>
    </div>

</asp:Content>