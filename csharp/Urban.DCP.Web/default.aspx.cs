using System;
using Azavea.Web.Page;

namespace Furman.PDP.Web
{
    public partial class Default : BasePage
    {
        protected override void InternalGET(System.Web.HttpContext context)
        {
            Master.SetTitle("Home");

            // OpenLayers css
            Master.RegisterCssFile("client/OpenLayers-2.11/theme/default/style.css");
            Master.RegisterCssFile("client/OpenLayers-2.11/theme/default/google.css");
            Master.RegisterCssFile("client/ktable/css/jquery.ktable.colsizable.css");
            Master.RegisterCssFile("client/css/pdp-app.css", true);
            Master.RegisterCssFile("client/feedbacker/css/feedbacker-min.css");
            Master.RegisterCssFile("http://www.furmancenter.org/tweaks/production.min.css");

            // IE css only
            Master.RegisterCssFile("client/css/pdp-ie.css", "IE", true);
            Master.RegisterCssFile("client/css/pdp-ie-lte7.css", "lte IE 7", true);

            // Google maps
            Master.RegisterJavascriptFile("http://maps.google.com/maps/api/js?key=AIzaSyCrmukm7Y-ioKmlKDSL7MYMdzsK0BQ_1Q0&sensor=false&v=3.6");
            
            // OpenLayers Javascript: This is a PATCHED version of openalayers, build with
            // a custom config file (checked into scripts)
            // http://trac.osgeo.org/openlayers/ticket/2828
            Master.RegisterJavascriptFile("client/OpenLayers-2.11/OpenLayers.js");
            

            // JQuery Plugins
            Master.RegisterJavascriptFile("client/ktable/jquery.event.drag-1.4.js");
            Master.RegisterJavascriptFile("client/ktable/jquery.ktable.colsizable-1.1.js");
            Master.RegisterJavascriptFile("client/jquery.tooltip/jquery.tooltip.min.js");

            // Application js
            Master.RegisterJavascriptFile("client/pdp.config.js", false);
            Master.RegisterJavascriptFile("client/pdp-app.js", true);

            // Feedbacker js
            Master.RegisterJavascriptFile("client/feedbacker/feedbacker-min.js");
            Master.RegisterJavascriptFile("http://www.furmancenter.org/tweaks/production.min.js");


        }
    }
}
