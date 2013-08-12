<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="confirmEmail.aspx.cs" Inherits="Urban.DCP.Web.WebForm1"  %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <%
        Response.Write(Confirm_Email(
            Request.QueryString.Get("userName"),
            Request.QueryString.Get("token")
           ));
         %>
    <br /><br />
    <a href="default.aspx">HOME</a>
</body>
</html>
