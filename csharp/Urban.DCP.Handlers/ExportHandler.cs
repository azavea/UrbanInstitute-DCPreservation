using System;
using System.IO;
using System.Net;
using System.Web;
using Azavea.Web;
using Azavea.Web.Handler;
using Urban.DCP.Data;
using Urban.DCP.Data.Uploadable;


namespace Urban.DCP.Handlers
{
    public class ExportHandler : BaseHandler
    {
        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            if (!user.IsSysAdmin())
            {
                context.Response.StatusCode = (int) HttpStatusCode.Forbidden;
                context.Response.Write("Not authorized, only Admins can export datasets.");
                return;
            }

            var type = WebUtil.ParseEnumParam<UploadTypes>(context, "type");
            context.Response.AddHeader("Content-type", "text/csv");
            context.Response.AddHeader("Content-Disposition", "attachment; filename=" + 
                type + "_export.csv");
            var csv = LoadHelper.GetLoader(type).Export();
            context.Response.Write(csv);
        }
    }
}