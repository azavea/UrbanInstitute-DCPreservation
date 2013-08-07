using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Web;
using Azavea.Open.Common;
using Azavea.Web;
using Azavea.Web.Exceptions;
using Azavea.Web.Handler;
using Furman.PDP.Data;

namespace Furman.PDP.Handlers
{
    /// <summary>
    /// Locates and streams a detailed property report, based on a PropertyID and user role.  Not
    /// cached as that interefered with switching logins and downloading the report again.
    /// </summary>
    public class ReportDownloadHandler : BaseHandler
    {
        /// <summary>
        /// Enable response compression.
        /// </summary>
        public ReportDownloadHandler() : base(true)
        {
        }

        /// <summary>
        /// Looks for a detailed pdf report to download based on a property id and the 
        /// authorized user roles
        /// </summary>
        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            string dir;
            string file;

            // Get the path and file names
            GetPathParts(context, out dir, out file);

            if (File.Exists((dir + "\\" + file)))
            {
                // Tell the client it is a pdf and an attachment, force a save as/open dialog
                context.Response.ContentType = "application/pdf";
                context.Response.AddHeader("Content-Disposition", "attachment; filename=" + file);
                context.Response.WriteFile(dir + "\\" + file);
            }
            else
            {
                _log.Error("Detailed Report path not found: [" + dir + "\\" + file + "]");
                throw new AzaveaWebMessageException("Could not load a detailed report for this property.");
            }
        }

        /// <summary>
        /// Checks to see if a report exists for the given propertyId and auth user roles.
        /// </summary>
        protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            string dir;
            string file;

            // Get the path and file names
            GetPathParts(context, out dir, out file);

            if (File.Exists((dir + "\\" + file)))
            {
                context.Response.Write(WebUtil.ObjectToJson(new {Exists = true}));
                return;
            }
            context.Response.Write(WebUtil.ObjectToJson(new { Exists = false }));
        }

        private void GetPathParts(HttpContext context, out string dir, out string file)
        {
            // Get the user roles, which determine the file to get
            IList<SecurityRole> roles = UserHelper.GetUserRoles(context.User.Identity.Name);

            // Get the propertyId for the desired report 
            string propertyId = WebUtil.GetParam(context, "propertyId", false);

            Config cfg = Config.GetConfig("PDP.Web");

            if (!cfg.ComponentExists("DetailedReports"))
            {
                // We don't have the data to download the reports
                _log.Error("DetailedReports component not found in the config file.");
                dir = "";
                file = "";
                return;
            }

            if (roles.Contains(SecurityRole.SysAdmin) || roles.Contains(SecurityRole.limited))
            {
                // Limited access reports are available
                dir = cfg.GetParameter("DetailedReports", "limited");
            }
            else
            {
                // Public reports are available
                dir = cfg.GetParameter("DetailedReports", "public");
            }

            // Determine the full file path to this report
            file = String.Format("{0}-detailed.pdf", propertyId);;
        }
    }
}
