using System.Net;
using System.Web.Security;
using Azavea.Web.Handler;

namespace Furman.PDP.Handlers
{
    public class LogoutHandler: BaseHandler
    {
        /// <summary>
        /// Logs a user out of the current authentication, the user will be anonymous.
        /// </summary>
        protected override void InternalPOST(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            // Log out from our authentication scheme
            FormsAuthentication.SignOut();

            // Let the client know that it's going to be ok
            context.Response.StatusCode = (int)HttpStatusCode.OK;
        }
    }
}
