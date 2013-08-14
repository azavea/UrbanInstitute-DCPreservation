using System;

namespace Urban.DCP.Web.admin
{
    public partial class Data : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.SetTitle("Data Management");

            Master.RegisterJavascriptFile("../client/ktable/jquery.event.drag-1.4.js");
            Master.RegisterJavascriptFile("../client/ktable/jquery.ktable.colsizable-1.1.js");
            Master.RegisterCssFile("../client/ktable/css/jquery.ktable.colsizable.css");

            
            Master.RegisterCssFile("../client/css/pdp-manage-users.css", true);

        }
    }
}
