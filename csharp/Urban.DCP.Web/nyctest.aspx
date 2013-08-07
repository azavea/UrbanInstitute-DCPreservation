<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="nyctest.aspx.cs" MasterPageFile="~/masters/Default.Master" Inherits="Furman.PDP.Web.NycTest" %>
<%@ MasterType TypeName="Furman.PDP.Web.masters.Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="contentPlaceHolder" runat="server">
    <h2>Nychanis Test Page</h2>
    
    <h3>Widget</h3>
    <div id="nychanis-search-container" class="test-container">
    
    </div>
    <div id="nychanis-results-container" class="test-container">
    </div>
    
    <!--
    <div id="test-query-container" class="test-container">
        <h3>Criteria</h3>
        <div id="test-query-criteria" class="test-container">
            Indicator: <select id="indicator"></select><br />
            Resolution: <select id="resolution"></select><br />
            Scope: <select id="scope"><option value=""></option></select><br />
            SubScope: <select id="subscope"><option value=""></option></select><br />
            Time Type: <select id="timetype"></select><br />
            Years: <input id="minyear" type="text" size="10" value="1970"/>
                to <input id="maxyear" type="text" size="10" value="2010"/><br />
            <br />
            <button type="button">Run Query</button>
        </div>
        <h3>Results</h3>
        <div id="test-query-results" class="test-container">
            
        </div>
    </div>
    -->
    
    <script type="text/javascript">
//        PDP.NycTest({ 
//            queryResultsTarget: '#test-query-results'
//        }).init();
        
        PDP.Nychanis.Results({ 
            target: '#nychanis-results-container',
        }).init();

        PDP.Nychanis.Search({ 
            target: '#nychanis-search-container'
        }).init();
    </script>
    
</asp:Content>