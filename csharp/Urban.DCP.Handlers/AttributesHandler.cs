using System;
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
    public class AttributesHandler : BaseHandler
    {
        /// <summary>
        /// Enable response compression.
        /// </summary>
        public AttributesHandler() : base(true) {}

        /// <summary>
        /// Do cache the response under all conditions.  This filter list
        /// changes infrequently.
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        protected override bool UseResponseCache(HttpContext context) { return true; }

        /// <summary>
        /// Set up more aggressive caching than the default.  These attributes are static
        /// and uploading new data will invalidate the cache
        /// </summary>
        /// <returns></returns>
        protected override TimeSpan GetCacheDuration()
        {
            // Cache for a week
            return new TimeSpan(7, 0, 0, 0);
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
