using System;
using System.Collections.Generic;
using System.IO;
using Azavea.Utilities.Common;
using NUnit.Framework;

namespace Furman.PDP.Data.Tests
{
    /// <exclude/>
    [TestFixture]
    public class UserTests
    {
        [TestFixtureSetUp]
        public void TestAddUser()
        {
            // Reset the unit test database by copying the template, since we don't know what any
            // other unit tests (or a previous run of this test) has done to the state of the db.
            File.Copy("..\\..\\Tests\\Template\\Test_User.mdb", "..\\..\\Tests\\Test_User.mdb", true);
        }

        [Test]
        public void TestAddDeleteUsers()
        {
            string p = Hasher.Encrypt("thePassword");
            UserHelper.CreateUser("testUser1", p, "test@example.com", "Test User", "@public");
            UserHelper.CreateUser("testUser2", p, "test@example.com", "Test User", "SysAdmin");
            UserHelper.CreateUser("testUser3", p, "test@example.com", "Test User", "limited");
            UserHelper.CreateUser("testUser4", p, "test@example.com", "Test User", "SysAdmin, @public");

            User testUser = UserHelper.GetUser("testUser1");
            Assert.IsNotNull(testUser, "First test user did not get created.");
            testUser = UserHelper.GetUser("testUser2");
            Assert.IsNotNull(testUser, "Second test user did not get created.");
            testUser = UserHelper.GetUser("testUser3");
            Assert.IsNotNull(testUser, "Third test user did not get created.");
            testUser = UserHelper.GetUser("testUser4");
            Assert.IsNotNull(testUser, "Fourth test user did not get created.");

            UserHelper.DeleteUser("testUser1");
            UserHelper.DeleteUser("testUser2");
            UserHelper.DeleteUser("testUser3");
            UserHelper.DeleteUser("testUser4");

            testUser = UserHelper.GetUser("testUser1");
            Assert.IsNull(testUser, "First user to delete still exists after delete.");
            testUser = UserHelper.GetUser("testUser2");
            Assert.IsNull(testUser, "Second user to delete still exists after delete.");
            testUser = UserHelper.GetUser("testUser3");
            Assert.IsNull(testUser, "Third user to delete still exists after delete.");
            testUser = UserHelper.GetUser("testUser4");
            Assert.IsNull(testUser, "Fourth user to delete still exists after delete.");
        }

        [Test]
        public void TestGetUser()
        {
            string testUser = "testUser";
            User account = UserHelper.GetUser(testUser);
            Assert.IsNotNull(account, String.Format("User: {0} should exist, but does not.",testUser ));    
        }

        [Test]
        public void TestUpdateExistingUser()
        {
            User testUser =UserHelper.GetUser("testUser");
            
            UserHelper.UpdateUser(testUser.UserName, testUser.Password, "new.test@example.com", testUser.Name, testUser.Roles);
            testUser = UserHelper.GetUser("testUser");

            Assert.AreEqual("new.test@example.com", testUser.Email, "User's email did not get updated.");
        }

        [Test]
        public void TestGetUserRoles()
        {
            ICollection<SecurityRole> userRoles = UserHelper.GetUserRoles("testUser");

            Assert.AreEqual(userRoles.Count, 2, "Number of roles for test user is incorrect.");
        }

        [Test]
        public void TestGetUsersCount()
        {
            int cnt = UserHelper.GetTotalUserCount();
            Assert.Greater(cnt, 0, "There were no users.");
        }

        [Test]
        public void TestGetAllUsers()
        {
            // First, make sure there are enough users to get to page 3.
            string p = Hasher.Encrypt("thePassword");
            UserHelper.CreateUser("testPagingUser1", p, "test@example.com", "Test User", "@public");
            UserHelper.CreateUser("testPagingUser2", p, "test@example.com", "Test User", "SysAdmin");
            UserHelper.CreateUser("testPagingUser3", p, "test@example.com", "Test User", "limited");
            UserHelper.CreateUser("testPagingUser4", p, "test@example.com", "Test User", "SysAdmin, @public");
            int pageNo = 3;
            int pageSize = 2;

            IList<User> users = UserHelper.GetUsers(pageNo, pageSize);
            Assert.Less(users.Count, pageSize + 1, "More users returned than pagination should allow.");
            Assert.Greater(users.Count, 0, "No users were returned.");
        }
    }
}
