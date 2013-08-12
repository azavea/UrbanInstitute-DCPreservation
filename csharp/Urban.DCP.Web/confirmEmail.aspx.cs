using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Urban.DCP.Data;

namespace Urban.DCP.Web
{
    public partial class WebForm1 : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected String Confirm_Email(String username, String token)
        {
            User user = UserHelper.GetUser(username);

            if (user != null && user.ConfirmEmail(token))
            {
                return "Thanks! Your email was confirmed.";
            }
            else
            {
                return "There was an error with that email confirmation link.";
            }
        }
    }
}