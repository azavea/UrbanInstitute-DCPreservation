using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Azavea.Open.Common;
using Azavea.Web;

namespace Furman.PDP.Web.masters
{
    public partial class Default : MasterBase
    {
        protected Config _config = Config.GetConfig("PDP.Web");

        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            string appUrl = WebUtil.GetApplicationUrl(Request);

            RegisterCssFile(appUrl + "client/jqueryui/css/custom/jquery-ui-1.8.5.custom.css");
            RegisterCssFile(appUrl + "client/pdp-core.css", true);

            RegisterJavascriptFile(appUrl + "client/jqueryui/jquery-1.4.2.min.js");
            RegisterJavascriptFile(appUrl + "client/jqueryui/jquery-ui-1.8.4.custom.min.js");
            RegisterJavascriptFile(appUrl + "client/pdp-core.js", true);
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            VerifyBrowser();
        }

        public void VerifyBrowser()
        {
            string appUrl = WebUtil.GetApplicationUrl(Request);

            IDictionary<string, string> browsers = _config.GetParametersAsDictionary("UnsupportedBrowsers");
            foreach (KeyValuePair<string, string> kvp in browsers)
            {
                if (Request.UserAgent == null || Regex.IsMatch(Request.UserAgent, kvp.Value))
                {
                    RegisterJavascriptFile(appUrl + "client/pdp-browser-warning.js", true);
                    _log.Warn("Detected unsupported browser. Regex: [" + kvp.Value + "] UserAgent: [" + Request.UserAgent + "]");
                    break;
                }
            }
        }

        public void SetTitle(string pageTitle, bool fullTitle)
        {

            if (fullTitle)
            {
                titleElement.Text = pageTitle;
            }
            else
            {
                titleElement.Text = pageTitle + " - " + titleElement.Text;
            }
        }

        public void SetTitle(string pageTitle)
        {
            SetTitle(pageTitle, false);
        }
    }
}
