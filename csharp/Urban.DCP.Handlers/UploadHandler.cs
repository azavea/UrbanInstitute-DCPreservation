using System;
using System.Net;
using System.Web;
using Azavea.Web;
using Azavea.Web.Handler;
using FileHelpers;
using Newtonsoft.Json.Linq;
using Urban.DCP.Data;
using Urban.DCP.Data.Uploadable;

namespace Urban.DCP.Handlers
{
    public class UploadHandler : BaseHandler 
    {
        protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            if (!user.IsSysAdmin())
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.Write("You do not have permissions to upload data");
                return;
            }
            
            var uploadType = WebUtil.ParseEnumParam<UploadTypes>(context, "type");
            if (context.Request.Files.Count != 1)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                context.Response.Write("CSV File is required");                
            }

            ErrorManager errors;
            switch (uploadType)
            {
                case UploadTypes.Project:
                     errors = Project.LoadProjects(context.Request.Files[0].InputStream).Errors;
                    context.Response.Write(JObject.FromObject(errors));
                    break;

                default:
                    context.Response.StatusCode = (int) HttpStatusCode.BadRequest;
                    context.Response.Write(String.Format("{0} is not a valid upload type.", uploadType));
                    break;
            }

        }
    }
}
