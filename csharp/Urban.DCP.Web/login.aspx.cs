using System;

namespace Furman.PDP.Web
{
    public partial class Login : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.SetTitle("Login");

            //Master.RegisterCssFile("client/css/pdp-login.css", true);
            Master.RegisterJavascriptFile("client/pdp-login.js", true);

        }
    }
}
