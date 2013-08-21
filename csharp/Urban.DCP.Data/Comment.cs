using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Azavea.Database;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;

namespace Urban.DCP.Data
{
    public class Comment
    {
        private static readonly FastDAO<Comment> _dao =
            new FastDAO<Comment>(Config.GetConfig("PDP.Data"), "PDB");

        public int Id;
        /// <summary>
        /// Property this comment is attached to
        /// </summary>
        public string NlihcId;

        /// <summary>
        /// Access level which this comment is viewable
        /// </summary>
        public CommentAccessLevel AccessLevel;

        /// <summary>
        /// If AccessLevel is set to Org mode, the org in question
        /// </summary>
        public int? AssociatedOrgId;
        public DateTime Created;
        public DateTime Modified;
        public string Username;

        /// <summary>
        /// Admin users can modify comments, this tracks who last
        /// edited the 
        /// </summary>
        public string LastEditorId;

        /// <summary>
        /// Optional Image attached to comment
        /// </summary>
        public byte[] Image;

        /// <summary>
        /// Text value of comment
        /// </summary>
        public string Text;

        public User User {
            get { return UserHelper.GetUser(Username); }
        }

        public User LastEditor
        {
            get { return UserHelper.GetUser(LastEditorId); }
        }

        public static void AddComment(string nlihcId, User user, 
            CommentAccessLevel level, string text, byte[] image)
        {
            var created = DateTime.Now;
            var comment = new Comment
                {
                    NlihcId = nlihcId,
                    AccessLevel = level,
                    AssociatedOrgId = level == CommentAccessLevel.Network ? user.Organization : null,
                    Created = created,
                    Modified = created,
                    Username = user.UserName,
                    Text = text,
                    Image = image
                };

            _dao.Insert(comment);
        }

        public static IList<Comment> GetAuthorizedComments(string nlihcId, User user)
        {
            var crit = new DaoCriteria();
            crit.Expressions.Add(new EqualExpression("NlihcId", nlihcId));

            // Anonymous users get only public comments
            if (user == null)
            {
                crit.Expressions.Add(new EqualExpression("AccessLevel", CommentAccessLevel.Public));
                return _dao.Get(crit);
            }

            // This kind of query is difficult in FastDAO, so, expecting that the number
            // of comments on a given property will be reasonable, prune off unauthorized
            // comments from the entire property comment list
            var comments = _dao.Get(crit);

            // SysAdmins can see everything
            if (user.IsSysAdmin())
            {
                return comments;
            }

            var authComments = new List<Comment>();
            foreach (var comment in comments)
            {
                switch (comment.AccessLevel)
                {
                    case CommentAccessLevel.Public:
                        authComments.Add(comment);
                        break;
                    case CommentAccessLevel.Network:
                        if (user.IsNetworked()) authComments.Add(comment);
                        break;
                    case CommentAccessLevel.SameOrg:
                        if (user.Organization == comment.AssociatedOrgId) authComments.Add(comment);
                        break;
                }
            }

            return authComments;

        }
    }
}
