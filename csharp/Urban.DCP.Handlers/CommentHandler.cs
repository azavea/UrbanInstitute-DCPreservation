using System;
using System.IO;
using System.Net;
using System.Text;
using System.Web;
using Azavea.Open.Common;
using Azavea.Utilities.Common;
using Azavea.Web;
using Azavea.Web.Exceptions;
using Azavea.Web.Handler;
using Newtonsoft.Json.Linq;
using Urban.DCP.Data;


namespace Urban.DCP.Handlers
{
    public class CommentHandler : BaseHandler
    {
        /// <summary>
        /// For a given property id, show returns all comments 
        /// the logged in user is allowed to see.
        /// Expects:
        /// id: string, property id
        /// </summary>
        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            var id = WebUtil.GetParam(context, "id", false);
            context.Response.Write(Comment.GetAuthorizedComments(id, user));
        }

        /// <summary>
        /// Add a new comment for a property.  Expects:
        /// id: string, property id
        /// level: CommentAccessLevel string
        /// text: comment text (optional, must have text or image)
        /// form file: image (optional)
        /// </summary>
        protected override void InternalPUT(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            if (user == null)
            {
                context.Response.StatusCode = (int) HttpStatusCode.Forbidden;
                context.Response.Write("Must be logged in to leave a comment");
                return;
            }

            var id = WebUtil.GetParam(context, "id", false);
            var level = WebUtil.ParseEnumParam<CommentAccessLevel>(context, "level");
            var text = WebUtil.GetParam(context, "text", true);
            byte[] image = null;

            if (context.Request.Files.Count == 1)
            {
                var stream = context.Request.Files[0].InputStream;
                using (var br = new BinaryReader(stream))
                {
                    image = br.ReadBytes((int)stream.Length);
                }
            }

            context.Response.Clear();
            if (text == null && image == null)
            {
                context.Response.StatusCode = (int) HttpStatusCode.BadRequest;
                context.Response.Write("Must include either text or image comment (or both).");
            }

            context.Response.Write(JToken.FromObject(
                Comment.AddComment(id, user, level, text, image)
            ));
        }

    }
}
