using System;
using System.Net;
using System.Security.Principal;
using System.Web;
using System.Web.Security;
using Azavea.Open.Common;
using Azavea.Utilities.Common;
using Azavea.Web;
using Azavea.Web.Handler;
using Urban.DCP.Data;
using System.Net.Mail;

namespace Urban.DCP.Handlers
{
    public class EmailConfirmationHandler : BaseHandler
    {

        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {

            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                context.Response.StatusCode = (int)HttpStatusCode.OK;
                context.Response.Write(WebUtil.ObjectToJson(new {EmailConfirmed = user.EmailConfirmed.ToString()}));
            }
            else
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return;
            }
            
        }

        /// <summary>
        /// GET this handler with a valid user object to send a confirmation email for that user.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="cache"></param>
        protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            if (context.User.Identity.IsAuthenticated)
            {
                // We are currently logged in
                User user = UserHelper.GetUser(context.User.Identity.Name);
                
                String confirmationToken = user.GetConfirmationToken();
                SendUserMail(user, confirmationToken);
             
                context.Response.StatusCode = (int)HttpStatusCode.OK;
                return;
            }
            else
            {
                // Nobody was logged in
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return;
            }
        }

        /// <summary>
        /// Sends an email 
        /// </summary>
        private void SendUserMail(User user, String confirmationToken)
        {
            // Get the mailer values from the config
            Config config = Config.GetConfig("PDP.Web");

            // SMTP config
            string smtpServer = config.GetParameter("Mailer", "SmtpServer");
            int smtpPort = Convert.ToInt32(config.GetParameter("Mailer", "SmtpPort"));
            string smtpUser = config.GetParameter("Mailer", "SmtpUser");
            string smtpHashedPassword = config.GetParameter("Mailer", "SmtpHashedPassword");

            //Email settings
            String link = String.Format(config.GetParameter("appSettings", "ConfirmationEmailURI"), user.UserName, confirmationToken);
            String emailBody = String.Format(config.GetParameter("appSettings", "ConfirmationEmailBody"), user.Name,
                user.Email, link, link);
            string emailFromAddress = config.GetParameter("NewUserNotification", "FromEmail");
            string emailFromName = config.GetParameter("NewUserNotification", "FromName");
            string emailTo = user.Email;
            string emailSubject = config.GetParameter("AppSettings", "ConfirmationEmailSubject");
       
      
            // Setup the mailer and message
            Mailer mailer = new Mailer(smtpServer, smtpPort, smtpUser, smtpHashedPassword);
            MailMessage msg = new MailMessage(new MailAddress(emailFromAddress, emailFromName), new MailAddress(emailTo));
            msg.Subject = emailSubject;
            msg.Body = emailBody;

            // Send it
            bool sent = mailer.SendMessageObject(msg);

            _log.Debug("Confirmation Email message sent, returned: [" + sent.ToString() + "]");
        }
    }
}
