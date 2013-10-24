<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Urban.DCP.Web.Default" %>
<%@ Import Namespace="Azavea.Open.Common"%>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Urban.DCP.Web.masters.Default" %>


<asp:Content ID="Script1" ContentPlaceHolderID="executeScriptPlaceHolder" runat="server">
    <script type="text/javascript">
        PDP.App({
            tabTarget: '#pdp-tab-container',
            dataViewPickerTarget: '#pdp-view-picker',
            appUrl: '<%=WebUtil.GetApplicationUrl(Request) %>'
        }).init();
    </script>
</asp:Content>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
    <div id="center">
        <div id="pdp-main-toolbar" class="pdp-toolbar">
            <div id="pdp-view-picker">
			    <input type="radio" id="pdp-table-view" name="radio" /><label for="pdp-table-view">Table</label>
			    <input type="radio" id="pdp-map-view" name="radio" checked="checked" /><label for="pdp-map-view">Map</label>
		    </div>
        </div>
        <div id="pdp-main">
            <div id="pdp-map-content" class="pdp-main-content pdp-map-view pdp-pdb-view pdp-nychanis-view">
                <div id="pdp-map-title-content" class="ui-corner-all"></div>
                <div id="pdp-map-layers-content"></div>
                <div id="pdp-map-geocode-content"></div>
            </div>
            <div id="pdp-pdb-table-content" class="pdp-main-content pdp-table-view pdp-pdb-view">
                <div id="pdp-pdb-table-toolbar" class="pdp-table-toolbar">
                    <div id="pdp-pdb-table-col-selector" class="pdp-table-col-selector"></div>
                    <div id="pdp-pdb-table-export" class="pdp-table-export"></div>
                </div>
                <div id="pdp-pdb-table-data" class="pdp-table-data"></div>
                <div id="pdp-pdb-table-pager" class="pdp-table-pager"></div>
            </div>
        </div>
    </div>
    <div id="left">
        <div id="pdp-tab-container">
            <div class="pdp-toolbar">
                <ul class="pdp-tab-header">
		            <li class="pdp-tab pdp-tab-pdb ui-corner-top"><a href="#pdp-pdb-view">Properties</a></li>
	            </ul>
	        </div>

            <div class="pdp-tab-content-container">
                <div id="pdp-pdb-view" class="pdp-tab-content"></div>
            </div>
        </div>
    </div>
    <script type="text/template" id="comment-form-template">
        <h1>Add Comment</h1>
       <p>
         <label for="comment-access-level">Access Level</label>
        <select id="comment-access-level">
            <option value="Public">Public</option>
            <option value="SameOrg">Same Organization</option>
            <option value="Network">Network</option>
        </select>
         </p>
        <label for="comment-image">Comment Image</label><br />
        <input type="file" name="files[]" id="comment-image"/><br />
        <label for="new-comment">New Comment</label><br />
        <textarea id="new-comment"></textarea><br />
        <button id="submit-new-comment">Submit Comment</button>
    </script>

    <script type="text/template" id="comment-template">
        <div style=""clear:both"></div>
        <div class="comment" >
            <div class="display">
                {% if (HasPicture) { %}<img src="<% Response.Write(ResolveUrl("~/handlers/comment-image.ashx")); %>?id={{ Id }}&amp;thumb=true" />{% } %}
                <p class="comment-text">{{ Text }}</p>
                <p class="comment-poster">posted by {{ Username }} on {{ formattedDate }}</p>
                <p class="comment-vis-label">visible to: {{ forwho }}</p>
                <p>{% if (CanDelete) { %}<button class="trash-comment">trash</button>{% } %}
                   {% if (CanEdit) { %}<button class="edit-comment">edit</button></p>{% } %}
             
            </div>
            <div class="edit" style="display:none">
                {% if (HasPicture) { %}<img src="<% Response.Write(ResolveUrl("~/handlers/comment-image.ashx")); %>?id={{ Id }}&amp;thumb=true" />{% } %}
                <select class="comment-access-level-edit">
                    <option value="Public">Public</option>
                    <option value="SameOrg">Same Organization</option>
                    <option value="Network">Network</option>
                </select>
                <input type="file" class="edited-image" name="files[]" /><br />
                <textarea class="edited-comment">{{ Text }}</textarea><br />
                
                {% if (HasPicture) { %}
                <p><input type="checkbox" class="remove-image" />remove image</p>
                {% } %}
                  <p>
                    <button class="cancel-edit">cancel</button>
                    <button class="save-edit">save</button>
                </p>
            </div>
            <hr />
    </script>

</asp:Content>