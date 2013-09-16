using System;
using System.IO;
using System.Net;
using System.Linq;
using System.Web;
using Azavea.Open.Common;
using Azavea.Utilities.Common;
using Azavea.Web;
using Azavea.Web.Exceptions;
using Azavea.Web.Handler;
using Newtonsoft.Json.Linq;
using Urban.DCP.Data;


namespace Urban.DCP.Handlers
{
    public class UploadRevisionHandler : BaseHandler
    {
        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            if (!user.IsSysAdmin())
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.Write("Not authorized, only superusers can manage revisions.");
                return;
            }

            String type = WebUtil.GetParam(context, "type", false);
            var typeEnum = (Data.Uploadable.UploadTypes)Enum.Parse(typeof(Data.Uploadable.UploadTypes), type); 
            var uploadRevisions = Urban.DCP.Data.PDB.PdbUploadRevision.GetUploadRevisions(typeEnum);
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
                context.Response.Write("Not authorized, only superusers can manage revisions.");
                return;
            }

            int idToRestore = WebUtil.ParseIntParam(context, "id");
            Urban.DCP.Data.PDB.PdbUploadRevision.RestoreRevision(idToRestore, user);

            context.Response.StatusCode = (int)HttpStatusCode.OK;
            context.Response.Write("{\"status\" : \"OK\"}");

        }
    }
}
