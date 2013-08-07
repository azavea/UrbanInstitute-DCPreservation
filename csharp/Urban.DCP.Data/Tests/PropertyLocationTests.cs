using System;
using Azavea.Open.Common;
using Furman.PDP.Data.PDB;
using NUnit.Framework;

namespace Furman.PDP.Data.Tests
{
    /// <exclude/>
    [TestFixture]
    public class PropertyLocationTests
    {
        private readonly PdbTwoTableHelper _helper = new PdbTwoTableHelper(Config.GetConfig("PDP.Data"), "Properties",
                PdbEntityType.Properties);
        private readonly SecurityRole[] _publicRoles = new SecurityRole[] { SecurityRole.@public };
        /// <exclude/>
        [Test]
        public void TestLocationQuery()
        {
            PdbResultLocations locs = _helper.QueryForLocations(null, _publicRoles,
                -8230000, -8200000, 4960000, 4990000, -8306466, -8164248, 4896833, 5040206);
            DumpResults(locs);
            // Should be number of cols in the DB attributes tables, but also one for the primary key.
            Assert.AreEqual(76, locs.Singles.Count, "Wrong number of single (non-clustered) points.");
            Assert.AreEqual(19, locs.Clusters.Count, "Wrong number of clustered point groups.");
        }

        public static void DumpResults(PdbResultLocations locations)
        {
            Assert.IsNotNull(locations, "Null locations object.");
            Assert.IsNotNull(locations.Singles, "Null list of singles.");
            Assert.IsNotNull(locations.Clusters, "Null list of clusters.");
            if (locations.Singles.Count == 0)
            {
                Console.WriteLine("Empty singles list.");
            }
            else
            {
                foreach (PdbPropertyLocation single in locations.Singles)
                {
                    Console.WriteLine(single);
                }
            }
            if (locations.Clusters.Count == 0)
            {
                Console.WriteLine("Empty clusters list.");
            }
            else
            {
                foreach (PdbClusterLocation cluster in locations.Clusters)
                {
                    Console.WriteLine(cluster);
                }
            }
        }
    }
}
