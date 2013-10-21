using System;
using System.Collections.Generic;
using Azavea.Database;
using Azavea.Open.Common;
using NUnit.Framework;
using Urban.DCP.Data.Uploadable;
using Urban.DCP.Data.Uploadable.Display;

namespace Urban.DCP.Data.Tests
{
    public class TestRowHolderByRole
    {
        public IList<Reac> pub;
        public IList<Reac> lim;
        public IList<Reac> net;
    }

    [TestFixture]
    public class ChildDisplayTests
    {
        private static readonly FastDAO<Reac> _reacDao =
            new FastDAO<Reac>(Config.GetConfig("PDP.Data"), "PDB");

        private static readonly FastDAO<ChildResourceInfo> _restricDao =
            new FastDAO<ChildResourceInfo>(Config.GetConfig("PDP.Data"), "PDB");

        private string _id = "NL000001";
      
        [SetUp] 
        public void SetUp()
        {
            _reacDao.Truncate();
            _restricDao.Truncate();

            var reac = new Reac
                {
                    NlihcId = _id,
                    Score = "23a*",
                    ScoreDate = DateTime.Today,
                    ScoreLetter = "a",
                    ScoreNum = 23
                };
            _reacDao.Insert(reac);
        }

        [Test] 
        public void TestPublicVisibility()
        {
            CreateRestriction(SecurityRole.@public);
            var results = GetWithRoles();

            Assert.NotNull(results.pub, "Publicly available data set should be visible to public");
            Assert.NotNull(results.lim, "Publicly available data set should be visible to limited");
            Assert.NotNull(results.net, "Publicly available data set should be visible to network");
        }

        [Test] 
        public void TestLimitedVisibility()
        {
            CreateRestriction(SecurityRole.limited);
            var results = GetWithRoles();
            
            Assert.IsNull(results.pub, "Limited available data set should be not be visible to public");
            Assert.NotNull(results.lim, "Limited available data set should be visible to limited");
            Assert.NotNull(results.net, "Limited available data set should be visible to network");
        }

        [Test] 
        public void TestNetworkVisibility()
        {
            CreateRestriction(SecurityRole.network);
            var results = GetWithRoles();
            
            Assert.IsNull(results.pub, "Network available data set should not be visible to public");
            Assert.IsNull(results.lim, "Network available data set should not be visible to limited");
            Assert.NotNull(results.net, "Network available data set should be visible to network");
        }

        private TestRowHolderByRole GetWithRoles()
        {
            ChildDisplayHelper.ReloadRoles();

            return new TestRowHolderByRole
                {
                    pub = ChildDisplayHelper.GetRows<Reac>(_id, new[] {SecurityRole.@public}),
                    net = ChildDisplayHelper.GetRows<Reac>(_id, new[] {SecurityRole.network}),
                    lim = ChildDisplayHelper.GetRows<Reac>(_id, new[] {SecurityRole.limited})
                };
        }

        private static void CreateRestriction(SecurityRole role)
        {
            var vis = new ChildResourceInfo
                {
                    Resource = ChildResourceType.ReacHistory,
                    RoleForDisplay = role 
                };
            _restricDao.Insert(vis);
        }
    }
}
