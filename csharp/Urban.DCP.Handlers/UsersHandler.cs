﻿using System;
using System.Net;
using System.Net.Mail;
using Azavea.Open.DAO.Criteria;
using Azavea.Web;
using Azavea.Web.Exceptions;
using Azavea.Web.Handler;
using Azavea.Open.Common;
using Furman.PDP.Data;
using Azavea.Utilities.Common;

namespace Furman.PDP.Handlers
{
    public class UsersHandler : BaseHandler
    {
        /// <summary>
        /// Tell the base class to compress output.
        /// </summary>
        public UsersHandler() : base(true) { }

        /// <summary>
        /// Get user details for a single user when a user name is provided.
        /// Otherwise, return a list of users.
        /// </summary>
        protected override void InternalGET(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            string userName = WebUtil.GetParam(context, "username", true);
            User authUser = UserHelper.GetUser(context.User.Identity.Name);
            string retVal;

            if (StringHelper.IsNonBlank(userName))
            {
                //Return the details for this user
                if (StringHelper.SafeEquals(userName, context.User.Identity.Name) || authUser.IsSysAdmin())
                {
                    retVal = WebUtil.ObjectToJson(UserHelper.MakeClientSafe(UserHelper.GetUser(userName), authUser));
                }
                else
                {
                    //User is logged in but is trying to info that does not belong to him.
                    throw new AzaveaWebNotAuthorizedException("Insuffient privileges.");
                }
            }
            else
            {
                if (authUser.IsSysAdmin())
                {
                    //Get the start and limit params and get the user list
                    int page = WebUtil.ParseIntParam(context, "page");
                    int pageSize = WebUtil.ParseIntParam(context, "pageSize");
                    int sortIndex = -1;

                    // Now get the ordering parameters, if specified.
                    WebUtil.ParseOptionalIntParam(context, "sortby", ref sortIndex);
                    SortOrder sort = null;
                    if (sortIndex >= 0)
                    {
                        // Default is ascending sort, passing false means descending.
                        bool ascending = true;
                        WebUtil.ParseOptionalBoolParam(context, "sortasc", ref ascending);

                        // Get the column name from the metadata for this column index, so we can sort on it
                        string sortColumnName = UserHelper.GetUserTableMetadata()[sortIndex].UID;
                        sort = new SortOrder(sortColumnName, ascending ? SortType.Asc : SortType.Desc);
                    }

                    // Get users with display metadata
                    ResultsWithMetadata<UserResultMetadata> results = UserHelper.FormatUsersWithMetadata(UserHelper.GetUsers(page, pageSize, sort), authUser);
                    retVal = WebUtil.ObjectToJson(results);

                }
                else
                {
                    //User is logged in but is trying to info that does not belong to him.
                    throw new AzaveaWebNotAuthorizedException("Insuffient privileges.");
                }
            }

            context.Response.Write(retVal);
        }

        /// <summary>
        /// Creates a user. Assumes that all user data will be provided.
        /// Ie. If you pass in a null name, we will save null as the
        /// name.  The only exception is password (no need to be passing
        /// that around all of the time).
        /// </summary>
        protected override void InternalPOST(System.Web.HttpContext context, HandlerTimedCache cache)
        {

            // Grab the params for this user
            string userName = WebUtil.GetParam(context, "username", true);
            string pass = WebUtil.GetParam(context, "password", true);
            string email = WebUtil.GetParam(context, "email", true);
            string name = WebUtil.GetParam(context, "name", true);
            string roles = WebUtil.GetParam(context, "roles", true);

            // If the password is coming through here (we haven't passed it out to
            // be able to pass it back in), we assume it's clear text and needs to be hashed.
            string hashPass = null;
            if (StringHelper.IsNonBlank(pass))
            {
                hashPass = Hasher.Encrypt(pass);
            }

            User userInDb = UserHelper.GetUser(userName);

            if (userInDb == null)
            {
                User newUser = UserHelper.CreateUser(userName, hashPass, email, name, roles);

                // Send an email to notify that a user has signed up and is requesting new permissions
                SendNewUserMail(newUser);
            }
            else
            {
                throw new AzaveaWebMessageException("This user name is unavailable.");
            }

            //If an exception is thrown, then the HTTP response code will
            //cause the AJAX call to error out.
        }

        /// <summary>
        /// Updates a user.
        /// </summary>
        protected override void InternalPUT(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            string userName = WebUtil.GetParam(context, "username", true);
            User authUser = UserHelper.GetUser(context.User.Identity.Name);

            if (StringHelper.IsNonBlank(userName))
            {
                //Return the details for this user
                if (StringHelper.SafeEquals(userName, context.User.Identity.Name) || authUser.IsSysAdmin())
                {
                    

                    // Grab the params for this user
                    string pass = WebUtil.GetParam(context, "password", true);
                    string email = WebUtil.GetParam(context, "email", true);
                    string name = WebUtil.GetParam(context, "name", true);
                    string roles = WebUtil.GetParam(context, "roles", true);

                    // If the password is coming through here (we haven't passed it out to
                    // be able to pass it back in), we assume it's clear text and needs to be hashed.
                    string hashPass = null;
                    if (StringHelper.IsNonBlank(pass))
                    {
                        hashPass = Hasher.Encrypt(pass);
                    }

                    User user = UserHelper.UpdateUser(userName, hashPass, email, name, roles);
                    
                    if (user != null)
                    {
                        context.Response.StatusCode = (int) HttpStatusCode.OK;
                        context.Response.Write(WebUtil.ObjectToJson(new {Name = user.Name, Admin = user.IsSysAdmin()}));
                        return;
                    }
                }
                else
                {
                    //User is logged in but is trying to info that does not belong to him.
                    throw new AzaveaWebNotAuthorizedException("Insuffient privileges.");
                }
            }
        }

        /// <summary>
        /// Deletes a user for a given user name.
        /// </summary>
        protected override void InternalDELETE(System.Web.HttpContext context, HandlerTimedCache cache)
        {
            User authUser = UserHelper.GetUser(context.User.Identity.Name);

            if (authUser.IsSysAdmin())
            {
                // Get the user name
                string userName = WebUtil.GetParam(context, "username", true);

                // Attempt to delete the user
                int numDeleted = UserHelper.DeleteUser(userName);

                if (numDeleted > 1)
                { 
                    _log.Error("More than one user was deleted when attempted to delete user [" + userName + "].");
                }
                else if (numDeleted == 0) 
                {
                    throw new AzaveaWebMessageException("Internal error. User was not deleted.");
                }
            }
            else 
            {
                //User is logged in but is trying to info that does not belong to him.
                throw new AzaveaWebNotAuthorizedException("Insuffient privileges.");
            }
        }

        /// <summary>
        /// Sends an email 
        /// </summary>
        /// <param name="newUser">The user who has just registered.</param>
        private void SendNewUserMail(User newUser)
        {
            // Get the mailer values from the config
            Config config = Config.GetConfig("PDP.Web");

            // SMTP config
            string smtpServer = config.GetParameter("Mailer", "SmtpServer");
            int smtpPort = Convert.ToInt32(config.GetParameter("Mailer", "SmtpPort"));
            string smtpUser = config.GetParameter("Mailer", "SmtpUser");
            string smtpHashedPassword = config.GetParameter("Mailer", "SmtpHashedPassword");

            // Email settings
            string emailBody = config.GetParameter("NewUserNotification", "Body");
            string emailFromAddress = config.GetParameter("NewUserNotification", "FromEmail");
            string emailFromName = config.GetParameter("NewUserNotification", "FromName");
            string emailTo = config.GetParameter("NewUserNotification", "ToEmail");
            string emailSubject = config.GetParameter("NewUserNotification", "Subject");

            // Substitute our values for the tokens from config
            emailBody = emailBody.Replace("{UserInfo}", newUser.UserName + Environment.NewLine + newUser.Name + Environment.NewLine + newUser.Email);

            // Setup the mailer and message
            Mailer mailer = new Mailer(smtpServer, smtpPort, smtpUser, smtpHashedPassword);
            MailMessage msg = new MailMessage(new MailAddress(emailFromAddress, emailFromName), new MailAddress(emailTo));
            msg.Subject = emailSubject;
            msg.Body = emailBody;

            // Send it
            bool sent = mailer.SendMessageObject(msg);

            _log.Debug("Reset Email message sent, returned: [" + sent.ToString() + "]");
        }
    }
}
