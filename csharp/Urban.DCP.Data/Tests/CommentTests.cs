using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Azavea.Database;
using Azavea.Open.Common;
using NUnit.Framework;

namespace Urban.DCP.Data.Tests
{
    [TestFixture]
    public class CommentTests
    {
        private static readonly FastDAO<User> _userDao =
            new FastDAO<User>(Config.GetConfig("PDP.Data"), "PDB");

        private static readonly FastDAO<Comment> _commentDao =
            new FastDAO<Comment>(Config.GetConfig("PDP.Data"), "PDB");

        private User sys;
        private User org1;
        private User org2;

        [TestFixtureSetUp]
        public void Setup()
        {
            _userDao.Truncate();
            _commentDao.Truncate();

            sys = new User
                {
                    Email = "",
                    EmailConfirmed = true,
                    Name = "SysAdmin",
                    UserName = "sys",
                    Roles = "SysAdmin,public"
                };
            org1 = new User()
                {
                    Email = "",
                    EmailConfirmed = true,
                    Name = "Orggy Org",
                    UserName = "ogre",
                    Roles = "Network,public",
                    Organization = 1
                };
            org2 = new User()
            {
                Email = "",
                EmailConfirmed = true,
                Name = "John Rambo",
                UserName = "johnrambo",
                Roles = "Network,public",
                Organization = 2
            };        
            UserHelper.Save(sys);
            UserHelper.Save(org1);

            Comment.AddComment("1a", sys, CommentAccessLevel.Network, "Network folks only", new byte[1]);
            Comment.AddComment("1a", sys, CommentAccessLevel.Public, "Hello, everyone", new byte[1]);
            Comment.AddComment("1a", org1, CommentAccessLevel.SameOrg, "Hello, co-workers", new byte[1]);
        }

        [Test]
        public void TestSysAdminGetsAll()
        {
            var comments = Comment.GetAuthorizedComments("1a", sys);
            Assert.AreEqual(3, comments.Count(), "SysAdmin should see all comments");
        }

        [Test]
        public void TestAnonymousGetsPublicOnly()
        {
            var comments = Comment.GetAuthorizedComments("1a", null);
            Assert.AreEqual(1, comments.Count(), "Anonymous users should only see public comments");
            Assert.AreEqual("Hello, everyone", comments[0].Text, "Should have gotten the public comment");
        }

        [Test]
        public void TestOtherOrgUserSeesNetworkAndPublicOnly()
        {
            var comments = Comment.GetAuthorizedComments("1a", org2);
            
            Assert.AreEqual(2, comments.Count(), "Network users should only see public and Network comments, not org only");
            Assert.AreEqual(1, comments.Count(c => c.AccessLevel == CommentAccessLevel.Public), "Should have 1 public comment");
            Assert.AreEqual(1, comments.Count(c => c.AccessLevel == CommentAccessLevel.Network), "Should have 1 network comment");
            
        }

        [Test]
        public void TestOwnOrgUserGetsAll()
        {
            var comments = Comment.GetAuthorizedComments("1a", sys);
            Assert.AreEqual(3, comments.Count(), "SysAdmin should see all comments");            
        }
    }
}
