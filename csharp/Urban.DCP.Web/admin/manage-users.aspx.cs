using System;
using Azavea.Web.Page;

namespace Urban.DCP.Web.admin
{
    public partial class ManageUsers : BasePage
    {
        protected override void InternalGET (System.Web.HttpContext context)
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
