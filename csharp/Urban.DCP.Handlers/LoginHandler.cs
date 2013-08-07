using System;
using System.Net;
using System.Security.Principal;
using System.Web;
using System.Web.Security;
using Azavea.Open.Common;
using Azavea.Utilities.Common;
using Azavea.Web;
using Azavea.Web.Handler;
using Furman.PDP.Data;

namespace Furman.PDP.Handlers
{
    public class LoginHandler : BaseHandler
    {
        /// <summary>
        /// Attempt to determine if any user is currently logged in.  If so, return a user object.
        /// </summary>
        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                context.Response.StatusCode = (int)HttpStatusCode.OK;
                context.Response.Write(WebUtil.ObjectToJson(new {Name = user.Name, Admin = user.IsSysAdmin(), Limited = user.IsLimited()}));
                return;
            }

            // Nobody was logged in
            context.Response.StatusCode = (int) HttpStatusCode.NoContent;
            return;
        }

        /// <summary>
        /// Attempt to log the user in
        /// </summary>
        protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            string username = WebUtil.GetParam(context, "username", false);
            string password = WebUtil.GetParam(context, "password", false);

            User user = UserHelper.GetUser(username);

            if (user == null)
            {
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                context.Response.Write("Account was not found.");
                return;
            }

            string hashedPassword = Hasher.Encrypt(password);

            string dbPassword = user.Password;
            if (!StringHelper.SafeEquals(dbPassword, hashedPassword))
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.Write("Login incorrect. Please try again.");
                return;
            }

            SetAuthCookie(context, username, user.Roles);

            context.Response.Write(WebUtil.ObjectToJson(new { Name = user.Name, Admin = user.IsSysAdmin(), Limited = user.IsLimited() }));
        }

        public static void SetAuthCookie(HttpContext context, string username, string roles)
        {
            FormsAuthentication.Initialize();
            DateTime expires = DateTime.Now.AddDays(14);

            FormsAuthenticationTicket ticket = new FormsAuthenticationTicket(1,
                                                                             username,
                                                                             DateTime.Now,
                                                                             expires,
                                                                             true,
                                                                             roles,
                                                                             FormsAuthentication.FormsCookiePath);

            HttpCookie authCookie = new HttpCookie(FormsAuthentication.FormsCookieName, FormsAuthentication.Encrypt(ticket));
            if (ticket.IsPersistent)
            {
                authCookie.Expires = ticket.Expiration;
            }
            context.Response.Cookies.Add(authCookie);

            FormsIdentity identity = new FormsIdentity(ticket);
            context.User = new GenericPrincipal(identity, roles.Split(','));
        }
    }
}
