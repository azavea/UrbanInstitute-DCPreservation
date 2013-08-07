using System;

namespace Furman.PDP.Web
{
    public partial class Signup : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.SetTitle("Sign Up");

            Master.RegisterCssFile("client/css/pdp-signup.css", true);
            Master.RegisterJavascriptFile("client/pdp-signup.js", true);
        }
    }
}
