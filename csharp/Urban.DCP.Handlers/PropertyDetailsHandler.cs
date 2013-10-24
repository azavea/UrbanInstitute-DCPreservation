using System.Collections.Generic;
using Azavea.Open.Common;
using Azavea.Web;
using Azavea.Web.Handler;
using Urban.DCP.Data;
using Urban.DCP.Data.PDB;

namespace Urban.DCP.Handlers
{
    public class PropertyDetailsHandler : BaseHandler
    {
        /// <summary>
        /// Enable response compression.
        /// </summary>
        public PropertyDetailsHandler(): base(true) {}

        protected override void InternalGET(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            var roles = UserHelper.GetUserRoles(context.User.Identity.Name);

            var dataHelper = new PdbTwoTableHelper(Config.GetConfig("PDP.Data"), "Properties");

            var ids = new List<string>();
            var id = WebUtil.GetParam(context, "id", true);
            if (id != null)
            {
                ids.Add(id);
            }
            else
            {
                var idList = WebUtil.GetParam(context, "ids", false);
                ids.AddRange(idList.Split(','));
            }
            var list = dataHelper.Query(ids, roles);

            context.Response.Write(WebUtil.ObjectToJson(list));
        }
    }
}
