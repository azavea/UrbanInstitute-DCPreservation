using System;
using System.Net;
using Azavea.Web;
using Azavea.Web.Page;
using FileHelpers;
using Newtonsoft.Json.Linq;
using Urban.DCP.Data;
using Urban.DCP.Data.Uploadable;
using Urban.DCP.Data.PDB;

namespace Urban.DCP.Web.admin
{
    public partial class Data : BasePage 

    {
        
        protected override void InternalGETorPOST(System.Web.HttpContext context)
        {
            Master.SetTitle("Data Management");

            Master.RegisterJavascriptFile("../client/moment.min.js");    
            Master.RegisterJavascriptFile("../client/ktable/jquery.event.drag-1.4.js");
            Master.RegisterJavascriptFile("../client/ktable/jquery.ktable.colsizable-1.1.js");
            Master.RegisterCssFile("../client/ktable/css/jquery.ktable.colsizable.css");
            Master.RegisterCssFile("../client/css/pdp-manage-users.css", true);
            Master.RegisterJavascriptFile("../client/pdp-app.js", true);

            if (context.Request.HttpMethod == "POST")
            {
                var user = UserHelper.GetUser(context.User.Identity.Name);
                if (!user.IsSysAdmin())
                {
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    context.Response.Write("You do not have permissions to upload data");
                    return;
                }

                var uploadType = WebUtil.ParseEnumParam<UploadTypes>(context, "type");
                if (context.Request.Files.Count != 1)
                {
                    resultLabel.Text = "CSV File is required";
                }

                ErrorManager errors = null;
                int added = 0;

                switch (uploadType)
                {
                    case UploadTypes.Project:
                        var import = Project.LoadProjects(context.Request.Files[0].InputStream, user);
                        errors = import.Errors;
                        added = import.Records.Length;
                        break;
                    case UploadTypes.Attribute:
                        var attrImport = PdbAttribute.LoadAttributes(context.Request.Files[0].InputStream, user);
                        errors = attrImport.Errors;
                        added = attrImport.Records.Length;
                        break;
                    default:
                        resultLabel.Text = String.Format("{0} is not a valid upload type.", uploadType);
                        break;
                }

                if (errors != null && errors.ErrorCount > 0)
                {
                    resultLabel.Text =
                        String.Format(
                            "There were {0} errors in the uploaded file, no records were imported.  Please correct the errors and try again.",
                            errors.ErrorCount);
                    resultTable.DataSource = errors.Errors;
                    resultTable.DataBind();
                }
                else if (resultLabel.Text == "")
                {
                    resultLabel.Text = String.Format("{0} {1} records were imported.", added, uploadType);
                }
                
            }
        }

    }
}
