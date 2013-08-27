using System.Collections.Generic;
using System.Linq;

namespace Urban.DCP.Data
{
    public class PropertyCommentInfo
    {
        private readonly User _user;

        public PropertyCommentInfo(string id, User user)
        {
            _user = user;
            Comments = Comment.GetAuthorizedComments(id, user)
                .Select(c => UiComment.FromComment(c, user));
        }

        public readonly IEnumerable<UiComment> Comments ;

        /// <summary>
        /// Can the user add comments to this property?
        /// (network or sys admin user)
        /// </summary>
        public bool CanAdd
        {
            get { return (_user != null && (_user.IsNetworked() || _user.IsSysAdmin())); }
        }

    }
}
