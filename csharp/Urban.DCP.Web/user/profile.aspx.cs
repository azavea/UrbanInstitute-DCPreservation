using System;

namespace Furman.PDP.Web.user
{
    public partial class Profile : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.SetTitle("Profile");

            Master.RegisterCssFile("../client/css/pdp-profile.css", true);
            Master.RegisterJavascriptFile("../client/pdp-profile.js", true);
        }
    }
}
