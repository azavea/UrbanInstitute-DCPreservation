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
        public PropertyDetailsHandler()
            : base(true)
        {
        }

        protected override void InternalGET(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            IList<SecurityRole> roles = UserHelper.GetUserRoles(context.User.Identity.Name);
            
            PdbTwoTableHelper dataHelper = new PdbTwoTableHelper(Config.GetConfig("PDP.Data"), "Properties",
                new [] {PdbEntityType.Properties, PdbEntityType.Reac, PdbEntityType.RealProperty});

            List<string> ids = new List<string>();
            string id = WebUtil.GetParam(context, "id", true);
            if (id != null)
            {
                ids.Add(id);
            }
            else
            {
                string idList = WebUtil.GetParam(context, "ids", false);
                ids.AddRange(idList.Split(','));
            }
            PdbResultsWithMetadata list = dataHelper.Query(ids, roles);

            context.Response.Write(WebUtil.ObjectToJson(list));
        }
    }
}
