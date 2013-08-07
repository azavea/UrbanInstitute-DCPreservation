using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Text;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;

namespace Furman.PDP.Web
{
    public class Global : System.Web.HttpApplication
    {

        protected void Application_Start(object sender, EventArgs e)
        {

        }

        protected void Session_Start(object sender, EventArgs e)
        {

        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {

        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {
            // Extract the forms authentication cookie
            string cookieName = FormsAuthentication.FormsCookieName;
            FormsAuthenticationTicket authTicket = null;
            
            HttpCookie authCookie = Context.Request.Cookies[cookieName];
            if (authCookie != null)
            {
                // Decrpyt our cookie and get the auth ticket
                authTicket = FormsAuthentication.Decrypt(authCookie.Value);
            }

            if (authTicket != null)
            {
                // When the ticket was created, the UserData property was assigned a
                // comma delimited string of role names.
                string[] roles = authTicket.UserData.Split(new char[] { ',' });

                // Create an Identity object
                FormsIdentity id = new FormsIdentity(authTicket);

                // This principal will flow throughout the request.
                GenericPrincipal principal = new GenericPrincipal(id, roles);

                // Attach the new principal object to the current HttpContext object
                // The user in the current context will have the proper roles assigned
                Context.User = principal;
            }
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            // Code that runs when an unhandled error occurs
            log4net.ILog log = log4net.LogManager.GetLogger(System.Reflection.Assembly.GetCallingAssembly().GetName().Name);
            Exception ex = Server.GetLastError();
            StringBuilder sb = new StringBuilder();
            sb.Append("Unhandled Exception: " + ex.Message + "\n");
            sb.Append("User: " + Context.User.Identity.Name + "\n");
            sb.Append("UserAgent: " + Request.UserAgent + "\n");
            sb.Append("UserHostAddress: " + Request.UserHostAddress + "\n");
            sb.Append("UserHostName: " + Request.UserHostName + "\n");
            sb.Append("UrlReferrer: " + Request.UrlReferrer + "\n");
            sb.Append("UrlRequested: " + Request.FilePath);
            log.Error(sb.ToString(), ex);
        }

        protected void Session_End(object sender, EventArgs e)
        {

        }

        protected void Application_End(object sender, EventArgs e)
        {

        }
    }
}