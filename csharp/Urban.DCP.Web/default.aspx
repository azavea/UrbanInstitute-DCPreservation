<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Furman.PDP.Web.Default" %>
<%@ Import Namespace="Azavea.Open.Common"%>
<%@ Import Namespace="Azavea.Web"%>
<%@ MasterType TypeName="Furman.PDP.Web.masters.Default" %>

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
            <div id="pdp-nychanis-table-content" class="pdp-main-content pdp-table-view pdp-nychanis-view">
                <div id="pdp-nychanis-table-toolbar" class="pdp-table-toolbar">
                    <div id="pdp-nychanis-table-export" class="pdp-table-export"></div>
                </div>
                <div id="pdp-nychanis-table-data" class="pdp-table-data"></div>
                <div id="pdp-nychanis-table-pager" class="pdp-table-pager"></div>
            </div>
        </div>
    </div>
    <div id="left">
        <div id="pdp-tab-container">
            <div class="pdp-toolbar">
                <ul class="pdp-tab-header">
		            <li class="pdp-tab pdp-tab-pdb ui-corner-top"><a href="#pdp-pdb-view">Housing (SHIP)</a></li>
		            <li class="pdp-tab pdp-tab-nyc ui-corner-top"><a href="#pdp-nychanis-view">Neighborhood Info</a></li>
	            </ul>
	        </div>

            <div class="pdp-tab-content-container">
                <div id="pdp-pdb-view" class="pdp-tab-content"></div>
                <div id="pdp-nychanis-view" class="pdp-tab-content"></div>
            </div>
        </div>
    </div>
    <div id="pdp-app-copyright"><a href="http://www.furmancenter.org/data/disclaimer/">&copy; Furman Center for Real Estate and Urban Policy 2010.</a></div>
    
</asp:Content>