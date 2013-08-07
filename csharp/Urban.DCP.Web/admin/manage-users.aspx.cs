using System;

namespace Furman.PDP.Web.admin
{
    public partial class ManageUsers : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.SetTitle("User Management");

            Master.RegisterJavascriptFile("../client/ktable/jquery.event.drag-1.4.js");
            Master.RegisterJavascriptFile("../client/ktable/jquery.ktable.colsizable-1.1.js");
            Master.RegisterCssFile("../client/ktable/css/jquery.ktable.colsizable.css");

            Master.RegisterJavascriptFile("../client/pdp-manage-users.js", true);
            Master.RegisterCssFile("../client/css/pdp-manage-users.css", true);

        }
    }
}
