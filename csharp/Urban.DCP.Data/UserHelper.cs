using System;
using System.Collections;
using System.Collections.Generic;
using Azavea.Database;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
using log4net;

namespace Furman.PDP.Data
{
    /// <summary>
    /// Utility class for doing things like user management and getting info for the current
    /// logged in user.
    /// </summary>
    public class UserHelper
    {
        protected static ILog _log = LogManager.GetLogger(
            new System.Diagnostics.StackTrace().GetFrame(0).GetMethod().DeclaringType.Namespace);

        private static readonly FastDAO<User> _userDao =
            new FastDAO<User>(Config.GetConfig("PDP.Data"), "Users");

        /// <summary>
        /// Returns the roles the given user has.
        /// </summary>
        /// <param name="userName">Name of the user.  May be null.</param>
        /// <returns>The roles that user is allowed to have.</returns>
        public static IList<SecurityRole> GetUserRoles(string userName)
        {
            // Retrieve the user and access the RolesList
            if (StringHelper.IsNonBlank(userName))
            {
                User account = GetUser(userName);
                if (account != null)
                {
                    return account.RolesList;
                }
            }

            // If there is no user, they get the "Everyone" role.
            return new SecurityRole[] { SecurityRole.@public };
        }

        /// <summary>
        /// Update an existing user and all fields passed in will overwrite existing values.
        /// </summary>
        /// <param name="userName">UserName for the user, existing or desired.</param>
        /// <param name="hashedPassword">The pre-hashed password for this user.</param>
        /// <param name="email">The email address of this user.</param>
        /// <param name="name">The actual name of this user.</param>
        /// <param name="roles">A comma seperated list of roles assigned to this user.</param>
        public static User UpdateUser(string userName, string hashedPassword, string email, 
                                            string name, string roles)
        {
            // Determine if this is new user or an update 
            User userAccount = GetUser(userName);

            // If a user was not found, create a new user object
            if (userAccount == null)
            {
                throw new ArgumentException("No record found for user name [" + userName + "].");
            }

            // Apply the information to the account
            // Check for an empty/null string, we don't want them in the db.
            if (StringHelper.IsNonBlank(email))
            {
                userAccount.Email = email;
            }
            if (StringHelper.IsNonBlank(name))
            {
                userAccount.Name = name;
            }
            if (StringHelper.IsNonBlank(roles))
            {
                userAccount.Roles = roles;
            }

            // Only overwrite password if the new one is non-blank
            if (StringHelper.IsNonBlank(hashedPassword))
            {
                userAccount.Password = hashedPassword;
            }
            
            // Save the information to the database
            _userDao.Update(userAccount);

            return userAccount;
        }

        /// <summary>
        /// Create a new user to the database.
        /// </summary>
        /// <param name="userName">UserName for the user, existing or desired.</param>
        /// <param name="hashedPassword">The pre-hashed password for this user.</param>
        /// <param name="email">The email address of this user.</param>
        /// <param name="name">The actual name of this user.</param>
        /// <param name="roles">A comma seperated list of roles assigned to this user.</param>
        public static User CreateUser(string userName, string hashedPassword, string email,
                                            string name, string roles)
        {
            User user = new User();

            // Apply the information to the account
            user.UserName = userName;
            user.Password = hashedPassword;
            user.Email = email;
            user.Name = name;
            if (StringHelper.IsNonBlank(roles))
            {
                user.Roles = roles;
            }
            else
            {
                user.Roles = SecurityRole.@public.ToString("G");
            }

            _userDao.Insert(user);

            return user;
        }

        /// <summary>
        /// Returns the details of the given user.
        /// </summary>
        /// <param name="userName">Name of the user.</param>
        /// <returns>The details of the user.</returns>
        public static User GetUser(string userName)
        {
            // If there is a user logged in, return the record
            if (StringHelper.IsNonBlank(userName))
            {
                return  _userDao.GetFirst("UserName", userName);
                
            }
            // If no user, return null
            return null;
        }

        /// <summary>
        /// Returns the total count of users in the database. Useful 
        /// for data pagination.
        /// </summary>
        /// <returns>The total number of users in the users table</returns>
        public static int GetTotalUserCount ()
        {
            // Call into db to the count of the users table
            return _userDao.GetCount(null);
        }

        /// <summary>
        /// Get all users from the user table, with limitations for a paging function.
        /// </summary>
        /// <param name="page">Which page of the data pagination you are on, 1-based.</param>
        /// <param name="pageSize">How many records to include, per page.</param>
        /// <returns></returns>
        public static IList<User> GetUsers(int page, int pageSize)
        {
            // Call through, but have a default sort by name, asc
            SortOrder nameSort = new SortOrder("Name", SortType.Asc);
            return GetUsers(page, pageSize, nameSort);

        }
        
        public static IList<User> GetUsers(int page, int pageSize, SortOrder sortOrder)
        {
            // Get all users, within the paging restrictions, sorted by Name
            DaoCriteria crit = new DaoCriteria();

            // Start recordset at the begining of the page
            crit.Start = (page * pageSize) - (pageSize);

            // Number of records to include
            crit.Limit = pageSize;

            // Order it by the requested column
            if (sortOrder != null)
            {
                crit.Orders.Add(sortOrder);
            }
            else
            {
                // Have a default sort of Name, Asc if nothing passed in
                crit.Orders.Add(new SortOrder("Name", SortType.Asc));
            }

            // Execute and return the query
            return _userDao.Get(crit);
        }

        public static ResultsWithMetadata<UserResultMetadata> FormatUsersWithMetadata(IList<User> users, User authUser)
        {
            // Create our metadata
            ResultsWithMetadata<UserResultMetadata> retVal = new ResultsWithMetadata<UserResultMetadata>();
            retVal.Attrs = GetUserTableMetadata();
            
            // Load up each user as a list of properties for the display widget
            retVal.Values = new List<IList<object>>();
            foreach (User user in users)
            {
                retVal.Values.Add(MakeClientSafeList(user, authUser));
            }

            // Add the total record count, for paging purposes
            retVal.TotalResults = GetTotalUserCount();

            return retVal;
        }
        /// <summary>
        /// Deletes the record of the given user.
        /// </summary>
        /// <param name="userName">The user to be deleted.</param>
        /// <returns>The number of records deleted. Should be 1 when successful.</returns>
        public static int DeleteUser(string userName)
        {
            // If there is a user, return the record
            if (StringHelper.IsNonBlank(userName))
            {
                DaoCriteria crit = new DaoCriteria();
                crit.Expressions.Add(new EqualExpression("UserName", userName));
                return _userDao.Delete(crit);
            }
            return 0;
        }

        /// <summary>
        /// Saves a password to the given username
        /// </summary>
        /// <param name="userName"></param>
        /// <param name="hashedPassword"></param>
        public static void SavePassword(string userName, string hashedPassword)
        {
            UpdateUser(userName, hashedPassword, null, null, null);
        }

        /// <summary>
        /// Take a user object and convert it to a List with only attributes allowable
        /// to the Authorized User
        /// </summary>
        /// <param name="user">User record to convert.</param>
        /// <param name="authUser">The Authenticated user who is attempting this action.</param>
        /// <returns>A List of user properties appropriate to display.</returns>
        public static List<object> MakeClientSafeList(User user, User authUser)
        {
            List<object> retVal = new List<object>();
            bool isSysAdmin = false;

            // If there is no authUser, then you are not a sysAdmin
            if (authUser != null)
            {
                isSysAdmin = authUser.IsSysAdmin();
            }

            if (isSysAdmin)
            {
                retVal.Add(user.UserName);
                retVal.Add(user.Name);
                retVal.Add(user.Email);
                retVal.Add(user.Roles);
            }
            else
            {
                retVal.Add(user.UserName);
                retVal.Add(user.Name);
                retVal.Add(user.Email);
            }

            return retVal;
        }
        /// <summary>
        /// Converts a user to client-safe object. No privileged info.
        /// </summary>
        /// <param name="user">Data User object to convert.</param>
        /// <param name="authUser">Currently authenticated user who can </param>
        /// <returns>A client-safe object.</returns>
        public static object MakeClientSafe(User user, User authUser)
        {
            object retVal;
            bool isSysAdmin = false;

            // If there is no authUser, then you are not a sysAdmin
            if (authUser != null)
            {
                isSysAdmin = authUser.IsSysAdmin();
            }

            if (isSysAdmin)
            {
                retVal = new
                {
                    user.UserName,
                    user.Name,
                    user.Email,
                    user.RolesList,
                    user.Roles

                };
            }
            else
            {
                retVal = new
                {
                    user.UserName,
                    user.Name,
                    user.Email
                };
            }

            return retVal;
        }

        /// <summary>
        /// Converts a list users to client-safe object. No privileged info.
        /// </summary>
        /// <param name="users">Data User objects to convert.</param>
        /// <param name="authUser">Indicates the level of detail available in client safe mode.</param>
        /// <returns>List of client-safe objects</returns>
        public static IList<object> MakeClientSafe(IEnumerable<User> users, User authUser)
        {
            IList<object> retVal = new List<object>();
            foreach (User user in users)
            {
                retVal.Add(MakeClientSafe(user, authUser));
            }
            return retVal;
        }

        /// <summary>
        /// This method will return the metadata about displaying user results
        /// </summary>
        /// <returns>List of metadata objects defining the columns to display for users.</returns>
        public static IList<UserResultMetadata> GetUserTableMetadata()
        {
            IList<UserResultMetadata> retVal = new List<UserResultMetadata>();
            retVal.Add(new UserResultMetadata("UserName","User Name", "text", true));
            retVal.Add(new UserResultMetadata("Name", "Full Name", "text", true));
            retVal.Add(new UserResultMetadata("Email", "Email", "text", true));
            retVal.Add(new UserResultMetadata("Roles", "Roles", "text", true));
            
            return retVal;
        }
    }
}
