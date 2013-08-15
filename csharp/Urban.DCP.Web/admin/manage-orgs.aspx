<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="manage-orgs.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Urban.DCP.Web.admin.ManageOrganizations" %>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Urban.DCP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
     <h2 id="pdp-profile-header">Organizations</h2>
     <div id="pdp-main"> 
         <div id="orgs"></div>
         <input type="text" id="new-org-name"/><button data-action="add">Add Organization</button>
    </div>

    <script type="text/template" id="org-template">
        <div class="org">
            <input type="text" data-id="{{ Id }}" class="org-name" value="{{ Name }}"/>
            <button data-action="delete">X</button>
        </div>
    </script>

    <script type="text/javascript">
        _.templateSettings = {
            interpolate: /\{\{(.+?)\}\}/g
        };
        var orgManager = new PDP.ManageOrgs({
            rowContainerId: "#orgs",
            rowClass: ".org",
            rowTemplateId: "#org-template",
            addRowInputId: "#new-org-name",
            handler: '/handlers/organizations.ashx' //TODO...handler: '<%=WebUtil.GetApplicationUrl(Request) %>'
        });
        orgManager.init();
    </script>
    
</asp:Content>