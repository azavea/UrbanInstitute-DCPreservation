using System;

namespace Furman.PDP.Web
{
    public partial class NycTest : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.SetTitle("Nychanis Test Page");
            Master.RegisterCssFile("client/ktable/css/jquery.ktable.colsizable.css");
            Master.RegisterJavascriptFile("client/ktable/jquery.event.drag-1.4.js");
            Master.RegisterJavascriptFile("client/ktable/jquery.ktable.colsizable-1.1.js");
            Master.RegisterCssFile("client/css/nyc-test.css", true);
            Master.RegisterJavascriptFile("client/nyc-test.js", true);
        }
    }
}
