using Azavea.Web;
using Azavea.Web.Handler;
using Urban.DCP.Data;
using Urban.DCP.Data.Uploadable;
using Urban.DCP.Data.Uploadable.Display;

namespace Urban.DCP.Handlers
{
    public class PropertyChildrenHandler : BaseHandler
    {
        /// <summary>
        /// Enable response compression.
        /// </summary>
        public PropertyChildrenHandler(): base(true) {}

        protected override void InternalGET(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            var roles = UserHelper.GetUserRoles(context.User.Identity.Name);
            var id = WebUtil.GetParam(context, "id", false);

            context.Response.Write(WebUtil.ObjectToJson(new
                {
                    Reac = ChildDisplayHelper.GetRows<Reac>(id, roles),
                    Parcel = ChildDisplayHelper.GetRows<Parcel>(id, roles),
                    RealProperty = ChildDisplayHelper.GetRows<RealPropertyEvent>(id, roles),
                    Subsidy = ChildDisplayHelper.GetRows<Subsidy>(id, roles)
                }
            ));
        }
    }
}
