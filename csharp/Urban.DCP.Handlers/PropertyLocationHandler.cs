using System.Collections.Generic;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
using Azavea.Web;
using Azavea.Web.Handler;
using Furman.PDP.Data;
using Furman.PDP.Data.PDB;

namespace Furman.PDP.Handlers
{
    public class PropertyLocationHandler : BaseHandler
    {
        /// <summary>
        /// Enable response compression.
        /// </summary>
        public PropertyLocationHandler()
            : base(true)
        {
        }

        protected override void InternalGET(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            IList<SecurityRole> roles = UserHelper.GetUserRoles(context.User.Identity.Name);
            
            IList<IExpression> expressions = PropertiesHandler.ParseExpressions(context);

            PdbTwoTableHelper dataHelper = new PdbTwoTableHelper(Config.GetConfig("PDP.Data"), "Properties", PdbEntityType.Properties);

            // x and y are expected in web mercator.
            PdbResultLocations list = dataHelper.QueryForLocations(expressions, roles,
                WebUtil.ParseDoubleParam(context, "minx"), WebUtil.ParseDoubleParam(context, "maxx"),
                WebUtil.ParseDoubleParam(context, "miny"), WebUtil.ParseDoubleParam(context, "maxy"),
                WebUtil.ParseDoubleParam(context, "minBx"), WebUtil.ParseDoubleParam(context, "maxBx"),
                WebUtil.ParseDoubleParam(context, "minBy"), WebUtil.ParseDoubleParam(context, "maxBy"));

            context.Response.Write(WebUtil.ObjectToJson(list));
        }
    }

}
