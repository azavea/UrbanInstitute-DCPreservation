using System;
using System.Collections.Generic;

namespace Urban.DCP.Data
{
    /// <summary>
    /// Represents a user from the PDP users table.
    /// </summary>
    public class User
    {
        /// <summary>
        /// // Cached version of the parsed string list of roles
        /// </summary>
        private IList<SecurityRole> _roleList = null;
        /// <summary>
        /// Numeric identifier for user record.
        /// </summary>
        public int Id;
        /// <summary>
        /// User handle.
        /// </summary>
        public string UserName;
        /// <summary>
        /// The hashed password for the user.
        /// </summary>
        public string Password;
        /// <summary>
        /// An email address for the user.
        /// </summary>
        public string Email;
        /// <summary>
        /// The user's actual name.
        /// </summary>
        public string Name;
        /// <summary>
        /// The actual text in the column - a comma separated list of roles
        /// </summary>
        public string Roles;
        /// <summary>
        /// The GUID used for email confirmation
        /// </summary>
        public string EmailConfirmationToken;
        /// <summary>
        /// Is the user's email confirmed?
        /// </summary>
        public Boolean EmailConfirmed;
        

        /// <summary>
        /// A list of role enums
        /// </summary>
        public IList<SecurityRole> RolesList
        {
            get
            {
                // Cache the list so we only parse apart the string once.
                if (_roleList == null)
                {
                    _roleList = new List<SecurityRole>();
                    //Parse Roles into a list of enums
                    string[] roles = Roles.Split(',');

                    foreach (string role in roles)
                    {
                        SecurityRole r = (SecurityRole) Enum.Parse(typeof (SecurityRole), role);
                        _roleList.Add(r);
                    }
                }

                // Return the cache
                return _roleList;
            }
        }


        /// <summary>
        /// Is this user a SysAdmin?
        /// </summary>
        public bool IsSysAdmin() 
        {
            return RolesList.Contains(SecurityRole.SysAdmin);
        }

        /// <summary>
        /// Does this user have limited data access?
        /// </summary>
        public bool IsLimited()
        {
            return RolesList.Contains(SecurityRole.limited);
        }

        public override string ToString()
        {
            return Name;
        }

        /// <summary>
        /// Cause a confirmation token to be created for this user.
        /// 
        /// </summary>
        public void SetConfirmationToken()
        {
            EmailConfirmationToken = Guid.NewGuid().ToString();
        }

        /// <summary>
        /// Check incoming conf token, and if match, set user has confirmed email address.
        /// </summary>
        /// <param name="token">The incoming token, IE from the confirmation request.</param>
        /// <returns></returns>
        public Boolean ConfirmEmail(String token)
        {
            if (EmailConfirmationToken != null && token != null && EmailConfirmationToken.Equals(token))
            {
                EmailConfirmed = true;
                EmailConfirmationToken = null;
                Save();
                return true;
            }
            else
            {
                return false;
            }
        }

        /// <summary>
        /// 
        /// Save this user object.
        /// </summary>
        public void Save()
        {
            UserHelper.Save(this);
        }


    }
}