using Azavea.Database;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
using System;
using System.Collections.Generic;

namespace Urban.DCP.Data
{
    /// <summary>
    /// Represents an organization from the PDP organizations table.
    /// </summary>
    public class Organization
    {

        public static readonly int NO_ORG = 0; //conveted to null in DB.
        public static readonly int NO_UPDATE = -1;

        private static readonly FastDAO<Organization> _orgDao =
           new FastDAO<Organization>(Config.GetConfig("PDP.Data"), "PDB");

        public int Id;
        public string Name;
        public bool Active;

        /// <summary>
        /// Get an organization by id.
        /// </summary>
        /// <param name="orgId">The id of the org object to get.</param>
        /// <returns></returns>
        public static Organization getOrgById(int orgId) {
            IList<Organization> result = _orgDao.Get("Id", orgId);
            if (result.Count == 0)
            {
                return null;
            }
            else
            {
                return result[0];
            }
        }

        /// <summary>
        /// Get a list of all active organizations
        /// </summary>
        /// <returns></returns>
        public static IList<Organization> GetAllActive()
        {
            return _orgDao.Get("Active", true);
        }

        /// <summary>
        ///  Delete an organization by id, this has the side effect of
        /// de-activating all users of that organization.
        /// </summary>
        /// <param name="organizationId">The id of the org to delete.</param>
        public static void Delete(int organizationId)
        {
            UserHelper.DeactivateUsersOfOrg(organizationId);
            var org = _orgDao.GetFirst("Id", organizationId);
            org.Active = false;
            _orgDao.Update(org);
        }

        /// <summary>
        /// Add an organization to the database.
        /// </summary>
        /// <param name="name"></param>
        public static void Add(string name)
        {
            var org = new Organization {Name = name, Active = true};
            _orgDao.Insert(org);
        }

        /// <summary>
        /// Update an organization
        /// </summary>
        /// <param name="id">The id of the org to update.</param>
        /// <param name="name">The new org name</param>
        public static void Update(int id, string name)
        {
            var org = getOrgById(id);
            org.Name = name;
            _orgDao.Update(org);
        }
            
    }
}