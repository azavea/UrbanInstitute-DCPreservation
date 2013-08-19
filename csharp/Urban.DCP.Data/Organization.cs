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

        private static readonly FastDAO<Organization> _orgDao =
           new FastDAO<Organization>(Config.GetConfig("PDP.Data"), "PDB");

        public int Id;
        public string Name;

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
        /// Get a list of organizations
        /// </summary>
        /// <returns></returns>
        public static IList<Organization> GetAll()
        {
            return _orgDao.Get();
        }

        /// <summary>
        ///  Delete an organization by id.
        /// </summary>
        /// <param name="organizationId">the id of the org to delete.</param>
        public static void Delete(int organizationId)
        {
            UserHelper.ClearOrganizationForUsers(organizationId);
            var crit = new DaoCriteria();
            crit.Expressions.Add(new EqualExpression("Id", organizationId));
            _orgDao.Delete(crit);
        }

        /// <summary>
        /// Add an organization to the database.
        /// </summary>
        /// <param name="name"></param>
        public static void Add(string name)
        {
            //TODO: unique constraint on Name.
            var org = new Organization();
            org.Name = name;
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