using System;
using System.Net;
using System.Security.Principal;
using System.Web;
using System.Web.Security;
using Azavea.Open.Common;
using Azavea.Utilities.Common;
using Azavea.Web;
using Azavea.Web.Handler;
using Urban.DCP.Data;
using System.Net.Mail;

namespace Urban.DCP.Handlers
{
    public class EmailConfirmationHandler : BaseHandler
    {

        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {

            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                context.Response.StatusCode = (int)HttpStatusCode.OK;
                context.Response.Write(WebUtil.ObjectToJson(new {EmailConfirmed = user.EmailConfirmed.ToString()}));
            }
            else
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return;
            }
            
        }

        /// <summary>
        /// GET this handler with a valid user object to send a confirmation email for that user.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="cache"></param>
        /*protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);

                if (user.EmailConfirmed)             
                {
                    //email is already confirmed, don't send another link.
                    context.Response.StatusCode = (int)HttpStatusCode.Created;
                    return;
                }
                else
                {
                    //generate confirmation token and email link.
                    String confirmationToken = user.GetConfirmationToken();
                    SendUserMail(user, confirmationToken);
                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    return;
                }
            }
        }*/

       
    }
}
