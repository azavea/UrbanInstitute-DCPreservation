<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="data.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Urban.DCP.Web.admin.Data" %>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Urban.DCP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
     <h2 id="pdp-profile-header">Upload Data Sets</h2>
     <div id="pdp-main">
         <form id="upload"action="<%=WebUtil.GetApplicationUrl(Request) %>handlers/upload.ashx" method="POST" enctype="multipart/form-data">
             <input id="dataset" name="dataset" type="file"/>
             <input id="type" name="type" type="text" value="project"/>
             <input type="submit" value="Upload"/>
         </form>
    </div>   
   
    
</asp:Content>