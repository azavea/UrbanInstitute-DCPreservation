using System;
using Azavea.Web.Page;
using Urban.DCP.Data;

namespace Urban.DCP.Web
{
    public partial class ConfirmEmailPage: BasePage  
    {
        protected override void InternalGET(System.Web.HttpContext context)
        {
            Master.RegisterCssFile("client/css/pdp-core.css", true);
            Master.RegisterCssFile("client/css/pdp-confirm-email.css", true);
        }
        protected String ConfirmEmail(String username, String token)
        {
            var user = UserHelper.GetUser(username);

            if (user != null && user.ConfirmEmail(token))
            {
                return "Thanks! Your email was confirmed and you may now log into the application. <br> " +
                       "If you requested access to the Preservation Network, there may be a delay before " +
                       "those features will be made available to you.";
            
            }
            // TODO: Get real help email address
            return "There was an error with that email confirmation link, please contact " +
                   "<a href='mailto:help@urban.org'>help@urban.org</a> for assistance.";
        }
    }
}