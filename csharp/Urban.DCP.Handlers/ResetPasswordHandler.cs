using System;
using System.Net;
using System.Text;
using System.Web;
using Azavea.Open.Common;
using Azavea.Utilities.Common;
using Azavea.Web;
using Azavea.Web.Exceptions;
using Azavea.Web.Handler;
using Furman.PDP.Data;
using System.Net.Mail;

namespace Furman.PDP.Handlers
{
    public class ResetPasswordHandler : BaseHandler
    {
        /// <summary>
        /// Random seed for random password generator
        /// </summary>
        private static Random random = new Random((int)DateTime.Now.Ticks);

        
        /// <summary>
        /// Creates a random string of letters.
        /// </summary>
        /// <param name="size">The size of the random string to be returned.</param>
        /// <returns></returns>
        private string RandomString(int size)
        {
            StringBuilder builder = new StringBuilder();
            char ch;
            for (int i = 0; i < size; i++)
            {
                ch = Convert.ToChar(Convert.ToInt32(Math.Floor(26 * random.NextDouble() + 65)));
                builder.Append(ch);
            }

            return builder.ToString();
        }

        /// <summary>
        /// Saves a new, randomized password to the user record.  An email will 
        /// be generated and sent out with the new password.  There is no authorization
        /// check because, by definition, you won't be logged in to perform this task.
        /// </summary>
        protected override void InternalPOST(HttpContext context, HandlerTimedCache cache)
        {
            // Get the user whose password needs to be reset
            string userName = WebUtil.GetParam(context, "username", false);

                // Make sure this user actually exists
                User user = UserHelper.GetUser(userName);
                if (user != null)
                {
                    // Also make sure that there is an email on file, or else we cannot proceed
                    if (StringHelper.IsNonBlank(user.Email))
                    {
                        // Create random text for new password
                        string randPass = RandomString(11);

                        // Hash and save it
                        string hashPass = Hasher.Encrypt(randPass);
                        UserHelper.SavePassword(userName, hashPass);

                        // Send the email
                        SendPasswordResetMail(user, randPass);

                        // Give some success feedback to the client    
                        context.Response.StatusCode = (int)HttpStatusCode.OK;
                        context.Response.Write("A temporary password has been emailed to you.");
                    }
                    else
                    {
                        // Give some failure feedback to the client    
                        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                        context.Response.Write("Unable to reset password.");
                    }
                }
                else
                {
                    // Give some failure feedback to the client    
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    context.Response.Write("Unable to reset password.");
                }
        }

        /// <summary>
        /// Sends an email to the specified user with thew new, temporary password.
        /// </summary>
        /// <param name="userToSend">The user to whom the password should be sent.</param>
        /// <param name="plainTextPass">The unhashed password the user should log in with.</param>
        private void SendPasswordResetMail(User userToSend, string plainTextPass)
        {
            // Get the mailer values from the config
            Config config = Config.GetConfig("PDP.Web");

            // SMTP config
            string smtpServer = config.GetParameter("Mailer", "SmtpServer");
            int smtpPort = Convert.ToInt32(config.GetParameter("Mailer", "SmtpPort"));
            string smtpUser = config.GetParameter("Mailer", "SmtpUser");
            string smtpHashedPassword = config.GetParameter("Mailer", "SmtpHashedPassword");
            string smtpRelayServer = config.GetParameter("Mailer", "SmtpRelayServer");

            // Email settings
            string emailBody = config.GetParameter("PasswordReset", "Body");
            string emailFromAddress = config.GetParameter("PasswordReset", "FromEmail");
            string emailFromName = config.GetParameter("PasswordReset", "FromName");
            string emailSubject = config.GetParameter("PasswordReset", "Subject");

            // Substitute our values for the tokens from config
            emailBody = emailBody.Replace("{ActualName}", userToSend.Name);
            emailBody = emailBody.Replace("{NewPassword}", plainTextPass);
            
            // Setup the mailer and message
            Mailer mailer = new Mailer(smtpServer, smtpPort, smtpUser, smtpHashedPassword);
            MailMessage msg = new MailMessage(new MailAddress(emailFromAddress, emailFromName), new MailAddress(userToSend.Email, userToSend.Name));
            msg.Subject = emailSubject;
            msg.Body = emailBody;

            // Send it
            bool sent = mailer.SendMessageObject(msg);

            _log.Debug("Reset Email message sent, returned: [" + sent.ToString() + "]");
        }
    }
}
