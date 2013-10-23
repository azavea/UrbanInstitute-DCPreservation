using System.Collections.Generic;
using System.Web;
using Azavea.Web;
using Azavea.Web.Handler;
using Urban.DCP.Data;
using Urban.DCP.Data.PDB;

namespace Urban.DCP.Handlers
{
    /// <summary>
    /// Returns information about the attributes in the PDB.
    /// </summary>
    public class AttributesHandler : CachedHandler
    {
        /// <summary>
        /// Enable response compression.
        /// </summary>
        public AttributesHandler() : base(true)
        {
        }

        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            IEnumerable<SecurityRole> roles = UserHelper.GetUserRoles(context.User.Identity.Name);
            IList<PdbCategory> list = PdbAttributesHelper.GetAttributesForClient(roles);
            
            context.Response.Write(WebUtil.ObjectToJson(new {
                TotalResults = list.Count,
                List = list
            }));
        }

        protected override string AdditionalCacheKey(HttpContext context, HandlerTimedCache cache)
        {
            // Override to make sure the user goes into the cache, 
            return context.User == null
            ? null
            : (context.User.Identity == null
                ? null
                : context.User.Identity.Name);
        }
    }
}
