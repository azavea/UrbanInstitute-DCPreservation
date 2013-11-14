using System;
using System.Net;
using System.Web;
using Azavea.Web;
using Azavea.Web.Handler;
using Newtonsoft.Json.Linq;
using Urban.DCP.Data;
using Urban.DCP.Data.PDB;
using Urban.DCP.Data.Uploadable;


namespace Urban.DCP.Handlers
{
    public class UploadRevisionHandler : BaseHandler
    {

        private const string UnauthMessage = "Not authorized, only superusers can manage revisions.";

        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            if (!user.IsSysAdmin())
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.Write(UnauthMessage);
                return;
            }

            var type = WebUtil.GetParam(context, "type", false);
            var typeEnum = (UploadTypes)Enum.Parse(typeof(UploadTypes), type); 
            var uploadRevisions = PdbUploadRevision.GetUploadRevisions(typeEnum);
            var json =  WebUtil.ObjectToJson(uploadRevisions);

            context.Response.StatusCode = (int)HttpStatusCode.OK;
            context.Response.Write(json);
        
        }
        protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            if (!user.IsSysAdmin())
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.Write(UnauthMessage);
                return;
            }

            var idToRestore = WebUtil.ParseIntParam(context, "id");
            PdbUploadRevision.RestoreRevision(idToRestore, user);

            context.Response.StatusCode = (int)HttpStatusCode.OK;
            context.Response.Write(JObject.FromObject(new
                {
                    status = "OK"
                }
            ));

        }
    }
}
