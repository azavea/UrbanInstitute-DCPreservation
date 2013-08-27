namespace Urban.DCP.Data
{
    public class UiComment: Comment
    {
        public bool CanEdit;
        public bool CanDelete;

        public static UiComment FromComment(Comment comment, User user)
        {
            var ui = Copy(comment);
            ui.CanDelete = ui.CanEdit = UserCanModify(user, ui);
            return ui;
        }

        private static bool UserCanModify(User user, UiComment ui)
        {
            // Authors and sys admins can edit/delete commentss
            return (user != null && (ui.User.Id == user.Id || user.IsSysAdmin()));
        }

        private static UiComment Copy(Comment comment)
        {
            return new UiComment
                {
                    AccessLevel = comment.AccessLevel,
                    AssociatedOrgId = comment.AssociatedOrgId,
                    Created = comment.Created,
                    LastEditorId = comment.LastEditorId,
                    Modified = comment.Modified,
                    NlihcId = comment.NlihcId,
                    Text = comment.Text,
                    Image = comment.Image,
                    Username = comment.Username,
                    Id = comment.Id
                };
        }
    }
}
