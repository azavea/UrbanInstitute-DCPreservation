using System;
using System.Web.Security;

namespace Furman.PDP.Web
{
    public partial class Logout : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.SetTitle("Logout");
            FormsAuthentication.SignOut();
            Response.Redirect("default.aspx");
        }
    }
}
