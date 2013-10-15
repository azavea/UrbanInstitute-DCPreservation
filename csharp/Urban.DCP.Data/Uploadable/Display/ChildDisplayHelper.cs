using System;
using System.Collections.Generic;
using System.Linq;
using Azavea.Database;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;

namespace Urban.DCP.Data.Uploadable.Display
{
    public class ChildDisplayHelper
    {

        internal static readonly FastDAO<ChildResourceInfo> Dao =
            new FastDAO<ChildResourceInfo>(Config.GetConfig("PDP.Data"), "PDB");

        private static readonly IDictionary<Type, ChildResourceType> ResourceMap = 
            new Dictionary<Type, ChildResourceType>
            {
                {typeof (Reac), ChildResourceType.ReacHistory},
                {typeof (Parcel), ChildResourceType.ParcelHistory},
                {typeof (RealPropertyEvent), ChildResourceType.RealPropertyHistory},
                {typeof (Subsidy), ChildResourceType.Subsidy}
            };

        private static IDictionary<ChildResourceType, SecurityRole> _roles;

        public static bool DisplayForRole(ChildResourceType type, IList<SecurityRole> roles)
        {
            if (_roles == null)
            {
                ReloadRoles();
            }

            if (_roles.ContainsKey(type))
            {
                var highest = roles.OrderBy(r => (int) r).Last();
                return highest >= _roles[type];
            }
            return false;
        }

        /// <summary>
        /// Refresh the cached role per resource settings
        /// </summary>
        public static void ReloadRoles()
        {
            var childen = Dao.Get();
            _roles = new Dictionary<ChildResourceType, SecurityRole>();
            foreach (var child in childen)
            {
                _roles.Add(child.Resource, child.RoleForDisplay);
            }

        }

        public static IList<T> GetRows<T>(string nlihcId, IList<SecurityRole> roles ) 
            where T: class , IDisplaySortable, new()
        {
            var dao = new FastDAO<T>(Config.GetConfig("PDP.Data"), "PDB");
            var crit = new DaoCriteria(new EqualExpression("NlihcId", nlihcId));
            var sortField = Activator.CreateInstance<T>().GetSortField();
            crit.Orders.Add(new SortOrder(sortField, SortType.Desc));
            return DisplayForRole(ResourceMap[typeof (T)], roles) ? dao.Get(crit) : null;
        }
    }
}
