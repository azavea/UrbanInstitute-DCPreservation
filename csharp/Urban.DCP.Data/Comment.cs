using System;
using System.Collections.Generic;
using Azavea.Database;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
using Newtonsoft.Json;

namespace Urban.DCP.Data
{
    public class CommentNotFoundException : Exception
    {
        public CommentNotFoundException() {}
        public CommentNotFoundException(string msg):base(msg){}
    }
    public class UnauthorizedToEditCommentException: Exception
    {
        public UnauthorizedToEditCommentException() { }
        public UnauthorizedToEditCommentException(string msg) : base(msg) { }
    }

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
        [JsonIgnore]
        public byte[] Image;

        /// <summary>
        /// Text value of comment
        /// </summary>
        public string Text;

        [JsonIgnore]
        public User User
        {
            get { return UserHelper.GetUser(Username); }
        }

        public User LastEditor
        {
            get { return UserHelper.GetUser(LastEditorId); }
        }

        /// <summary>
        /// Update the comment, if authorized
        /// </summary>
        /// <param name="user">Editing user</param>
        /// <param name="text">The new text.  If the text is unchanged, provide
        /// the original text.  This lets you take whatever is in the user text box</param>
        /// <param name="image">New image to use (null if no change, don't need to reupload orig) </param>
        /// <param name="removeImage">Flag to indicate the image was removed, since null image is no-op</param>
        public void Update(User user, string text, byte[] image, bool removeImage = false)
        {
            AssertModifyAuthorization(user);
            if (removeImage) Image = new byte[0];
            Text = text;

            // Only update the image if there was one passed and there is
            // no instruction to remove it.  If the image edit was a no-op,
            // it won't have been submitted and will be null, otherwise it's new
            if (image != null && !removeImage)
            {
                Image = image;
            }

            LastEditorId = user.UserName;
            Modified = DateTime.Now;

            _dao.Save(this);
        }

        /// <summary>
        /// Removes a comment from 
        /// </summary>
        /// <param name="user"></param>
        public void Delete(User user)
        {
            AssertModifyAuthorization(user);
            _dao.Delete(this);
        }

        private void AssertModifyAuthorization(User user)
        {
            // Comment authors or admins can edit/delete a comment
            if (user == null || (user.UserName != Username && !user.IsSysAdmin()))
            {
                throw new UnauthorizedToEditCommentException();
            }
        }

    /// <summary>
        /// Non images are stored as emtpy byte arrays, this
        /// is a convenience method for that.  Property so it
        /// can be serialized to the client
        /// </summary>
        /// <returns></returns>
        public bool HasPicture 
        {
            get { return Image != null && Image.Length > 0; }
            
        }

        public static Comment AddComment(string nlihcId, User user, 
            CommentAccessLevel level, string text, byte[] image)
        {
            var imageVal = image ?? new byte[] {};

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
                    Image = imageVal
                };

            _dao.Insert(comment, true);
            return comment;
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

        /// <summary>
        /// Returns a comment by its Id
        /// </summary>
        /// <param name="commentId"></param>
        /// <returns>Comment or null if not found</returns>
        public static Comment ById(int commentId)
        {
            var user = _dao.GetFirst("Id", commentId);
            if (user == null) throw new CommentNotFoundException();
            return user;
        }
    }

}
