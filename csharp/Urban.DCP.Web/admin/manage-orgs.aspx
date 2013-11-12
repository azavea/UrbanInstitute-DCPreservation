<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="manage-orgs.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Urban.DCP.Web.admin.ManageOrganizations" %>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Urban.DCP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
     <h2 id="pdp-profile-header">Manage Preservation Network Organizations</h2>
     <div id="pdp-main"> 
         <h4>Add New Organization</h4>
         <input type="text" id="new-org-name" placeholder="Org Name"/><button data-action="add">Add Organization</button>

         <h4>Existing Organizations</h4>
         <table>
             <thead><tr><th>Action</th><th>Id</th><th>Organization</th></tr></thead>
             <tbody id="orgs">
                 
             </tbody>
         </table>
    </div>

    <script type="text/template" id="org-template">
        <tr>
            <td>
                <a href="#" data-id="{{ Id }}" class="delete">Delete</a>
                <a href="#" data-id="{{ Id }}" class="edit">Edit</a>
            </td>
            <td>{{ Id }} </td>
            <td class="name">{{ Name }}</td>
        </tr>
    </script>

    <script type="text/template" id="org-edit-template">
        <div>
            <h3>Update Preservation Network Organization</h3>
            <label>Name:</label>
            <input class="updated-name" type="text" value="{{ name }}" />
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
            updateTemplateId: "#org-edit-template",
            addRowInputId: "#new-org-name",
            handler: '<%=WebUtil.GetApplicationUrl(Request) %>'
        });
        orgManager.init();
    
    </script>
    
</asp:Content>