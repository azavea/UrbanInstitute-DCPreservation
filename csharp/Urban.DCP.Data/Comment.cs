using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Azavea.Database;
using Azavea.Open.Common;

namespace Urban.DCP.Data
{
    public class Comment
    {
        private static readonly FastDAO<Comment> _dao =
            new FastDAO<Comment>(Config.GetConfig("PDP.Data"), "PDB");

        public int Id;
        public int NlihcId;
        public CommentAccessLevel AccessLevel;
        public DateTime Created;
        public DateTime Modified;
        public string Username;
        public string LastEditorId;
        public byte[] Image;

        public User User {
            get { return UserHelper.GetUser(Username); }
        }

        public User LastEditor
        {
            get { return UserHelper.GetUser(LastEditorId); }
        }

    }
}
