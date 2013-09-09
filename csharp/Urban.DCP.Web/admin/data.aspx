<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="data.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Urban.DCP.Web.admin.Data" %>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Urban.DCP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
     <h2 id="pdp-profile-header">Upload Data Sets</h2>
     <div id="pdp-main">
         <form id="upload" method="POST" enctype="multipart/form-data">
             <input id="dataset" name="dataset" type="file"/>
             <select id="type" name="type">
                 <option value="project">project</option>
                 <option value="attribute">attributes</option>
             </select>
             <input type="submit" value="Upload"/>
         </form>
         
         <form id="uploadResult" runat="server">
             <asp:Label runat="server" ID="resultLabel"></asp:Label>
             <asp:GridView runat="server" ID="resultTable" class="admin-result-table"></asp:GridView>
         </form>
    </div>   
   
    
</asp:Content>