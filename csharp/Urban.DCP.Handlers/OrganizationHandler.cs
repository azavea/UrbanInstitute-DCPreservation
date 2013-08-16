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
using System.Collections.Generic;

namespace Urban.DCP.Handlers
{
    public class OrganizationHandler : BaseHandler
    {

        /// <summary>
        /// Get a list of Organizations
        /// </summary>
        /// <param name="context"></param>
        /// <param name="cache"></param>
        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {

            if (context.User.Identity.IsAuthenticated)
            {
                
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                if (user.IsSysAdmin())
                {
                    IList<Organization> orgs = Organization.GetAll();

                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    string json = WebUtil.ObjectToJson(orgs);
                    context.Response.Write(json);
                } else {
                    context.Response.Write("not authorized");
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    return;
                }

            }
            else
            {
                context.Response.Write("not authenticated");
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                return;
            }
            
        }

        /// <summary>
        /// Add a new organization.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="cache"></param>
        protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                if (user.IsSysAdmin())
                {
                    string name = WebUtil.GetParam(context, "name", true);
                    Organization.Add(name);
                    context.Response.Write("ok");
                    context.Response.StatusCode = (int)HttpStatusCode.Created;
                    return;
                }
                else
                {
                    context.Response.Write("not authorized");
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    return;
                }
            }
            context.Response.Write("not authenticated");
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            return;
        }
 
        /// <summary>
        /// Delete an organization
        /// </summary>
        /// <param name="context"></param>
        /// <param name="cache"></param>
       protected override void InternalDELETE(HttpContext context, HandlerTimedCache cache)
        {
            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                if (user.IsSysAdmin())
                {
                    int id = Int32.Parse(WebUtil.GetParam(context, "id", true));
                    Organization.Delete(id);
                    context.Response.Write("\"{'result':'deleted'}\"");
                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    return;
                }
                else
                {
                    context.Response.Write("not authorized");
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    return;
                }
            }
            context.Response.Write("not authenticated");
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            return;
        }

        /// <summary>
        /// Update an organization by changing its name.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="cache"></param>
        protected override void InternalPUT(HttpContext context, HandlerTimedCache cache)
        {
            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                if (user.IsSysAdmin())
                {
                    string name = WebUtil.GetParam(context, "name", true);
                    int id = Int32.Parse(WebUtil.GetParam(context, "id", true));
                    Organization.Update(id, name);
                    context.Response.Write("\"{'result':'updated'}\"");
                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    return;
                }
                else
                {
                    context.Response.Write("not authorized");
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    return;
                }
            }
            context.Response.Write("not authenticated");
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            return;
        }
    }


}
