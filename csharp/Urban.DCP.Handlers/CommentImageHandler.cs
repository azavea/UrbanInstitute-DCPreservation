using System;
using System.Drawing.Imaging;
using System.IO;
using System.Net;
using System.Web;
using Azavea.Web;
using Azavea.Web.Handler;
using Urban.DCP.Data;
using System.Drawing;


namespace Urban.DCP.Handlers
{
    public class CommentImageHandler : BaseHandler
    {
        private const int THUMB_WIDTH = 100;
        private const int THUMB_HEIGHT = 100;

        /// <summary>
        /// For a given comment id, return the image
        /// If there is no image associated, a 404
        /// Expects:
        /// id: string, comment id
        /// thumb: bool, optional render as thumbnail
        /// </summary>
        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            var user = UserHelper.GetUser(context.User.Identity.Name);
            var thumb = false;
            WebUtil.ParseOptionalBoolParam(context, "thumb", ref thumb);
            
            // Default to 100x100 if in thumbnail mode, but can override.
            var width = THUMB_WIDTH;
            WebUtil.ParseOptionalIntParam(context, "w", ref width);
            var height = THUMB_HEIGHT;
            WebUtil.ParseOptionalIntParam(context, "h", ref height);

            var id = WebUtil.ParseIntParam(context, "id");
            try
            {
                var comment = Comment.ById(id);
                if (!comment.HasPicture)
                {
                    throw new CommentNotFoundException();
                }

                if (comment.IsAuthorizedToView(user))
                {
                    var img = comment.Image;
                    var format = GetImageFormat(img);
                    context.Response.ContentType = String.Format("image/{0}", format);

                    if (thumb)
                    {
                        var ms = new MemoryStream();
                        ms.Write(img, 0, img.Length);
                        var b = new Bitmap(ms);
                        var thumbnail = b.GetThumbnailImage(width, height, () => false, IntPtr.Zero);
                        var outStream = new MemoryStream();
                        thumbnail.Save(outStream, format);
                        img = outStream.ToArray();
                    }
                    context.Response.BinaryWrite(img);
                    return;
                }
                context.Response.StatusCode = (int) HttpStatusCode.Forbidden;
            }
            catch (CommentNotFoundException)
            {
                context.Response.StatusCode = (int) HttpStatusCode.NotFound;
            }
        }

        private static ImageFormat GetImageFormat(byte[] image)
        {
            var format = Image.FromStream(new MemoryStream(image)).RawFormat;
   
            if (format.Equals(ImageFormat.Jpeg))
            {
                return ImageFormat.Jpeg;
            }
            if (format.Equals(ImageFormat.Png))
            {
                return ImageFormat.Png;
            }
            if (format.Equals(ImageFormat.Gif))
            {
                return ImageFormat.Gif;
            }
            if (format.Equals(ImageFormat.Tiff))
            {
                return ImageFormat.Tiff;
            }

            // If we can't figure out the type, try it as a jpeg
            return ImageFormat.Jpeg;
            
        }
    }

 
}
