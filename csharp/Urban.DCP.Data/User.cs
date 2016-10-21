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
        /// Is this user account active?  Users who are 'deleted'
        /// or whos organizations are deleted will be deactivated 
        /// </summary>
        public bool Active;
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
        /// Company or organization affiliation, as contact information, not
        /// Preservation Network Organization
        /// </summary>
        public string Affiliation;
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
        /// The Preservation Network Organization id that this user
        /// is affiliated with
        /// </summary>
        public int? Organization;
        /// <summary>
        /// During signup, did the user request to be considered for a
        /// Preservation Network affiliation?
        /// </summary>
        public bool NetworkRequested;


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
        /// Is this user a Newtwork user?
        /// </summary>
        public bool IsNetworked()
        {
            return RolesList.Contains(SecurityRole.network);
        }

        /// <summary>
        /// The user is authorized to add comments if they are
        /// in rolse sysadmin or network
        /// </summary>
        /// <returns></returns>
        public bool CanAddComments()
        {
            return IsSysAdmin() || IsNetworked();
        }

        /// <summary>
        /// Does this user have limited data access?
        /// </summary>
        public bool IsLimited()
        {
            return RolesList.Contains(SecurityRole.limited);
        }

        /// <summary>
        /// Is the user authorized to export as csv?  Must be confirmed and
        /// either Network or SysAdmin role
        /// </summary>
        /// <returns></returns>
        public bool CanExport()
        {
            return EmailConfirmed && (IsNetworked() || IsSysAdmin());
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

        /// <summary>
        /// Set organization.  Null or Organization.NO_ORG clears the org
        /// and removes the Network role.  
        /// </summary>
        /// <param name="organization">the idx in the org table, null or Org.NO_ORG</param>
        public void SetOrganization(int? organization)
        {
            if (organization == null || organization == Urban.DCP.Data.Organization.NO_ORG) {
                {
                    RemoveRole(SecurityRole.network);
                }
                Organization = null;
            }
            else if (organization == Urban.DCP.Data.Organization.NO_UPDATE)
            {
                // do nothing
            }
            else
            {
                AddRole(SecurityRole.network);
                Organization = organization;
            }
        }

        private void AddRole(SecurityRole role)
        {
            if (! RolesList.Contains(role))
            {
                _roleList.Add(role);
                Roles = RenderRoleList(_roleList);
            }
        }

        private void RemoveRole(SecurityRole role)
        {
            if (RolesList.Contains(role))
            {
                _roleList.Remove(role);
                Roles = RenderRoleList(_roleList);
            }
        }

        private string RenderRoleList(IList<SecurityRole> roles)
        {
            List<String> roleStrings = new List<String>();
            for (int i = 0; i < _roleList.Count; i++)
            {
                roleStrings.Add(_roleList[i].ToString());
            }
            return string.Join(",", roleStrings.ToArray());
        }
    }
}