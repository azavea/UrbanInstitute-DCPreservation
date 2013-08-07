using System;
using System.Collections.Generic;

namespace Furman.PDP.Data
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
    }
}