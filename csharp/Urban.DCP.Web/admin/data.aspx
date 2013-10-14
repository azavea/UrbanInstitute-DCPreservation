<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="data.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Urban.DCP.Web.admin.Data" %>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Urban.DCP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
     <h2 id="pdp-profile-header">Upload Data Sets</h2>
     <div id="pdp-main">
         <form id="upload" method="POST" enctype="multipart/form-data">
             <input id="dataset" name="dataset" type="file"/>
             <select id="type" name="type">
                 <option value="Project">Project Details</option>
                 <option value="Reac">Reac Scores</option>
                 <option value="Parcel">Parcel Details</option>
                 <option value="RealPropertyEvent">Real Property Events</option>
                 <option value="Subsidy">Subsidy Details</option>
                 <option value="Attribute">Filter & Display Attributes</option>
             </select>
             <input type="submit" value="Upload"/>
         </form>
         
         <form id="uploadResult" runat="server">
             <asp:Label runat="server" ID="resultLabel"></asp:Label>
             <asp:GridView runat="server" ID="resultTable" class="admin-result-table"></asp:GridView>
         </form>
    </div>   
   
    <div id="previous-revision-container"></div>
    <button style="display:none" id="request-previous-revision">Request Previous Revision</button>



    <script type="text/template" id="revision-template">
        <div class="org">
            <input type="radio" name="previous-revision" value="{{ Id }}"><span style="font-family:monospace;font-size:1.2em">{{ Hash }}</span>  | {{UserName}} | {{ formattedDate }}</input>
        </div>
    </script>

    <script type="text/javascript">
        _.templateSettings = {
            interpolate: /\{\{(.+?)\}\}/g
        };
        var revisionController = new PDP.UploadRevisionController({
            typeSelect: "#type", 
            revisionRadio: "input[name=previous-revision]:checked", 
            revisionContainer: "#previous-revision-container",
            revisionTemplate: "#revision-template",
            requestButton: "#request-previous-revision",
            handler: '<%=WebUtil.GetApplicationUrl(Request) %>'
        });
        revisionController.init();
    </script>
    
</asp:Content>