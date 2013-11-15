using System;
using Urban.DCP.Data.PDB;

namespace Urban.DCP.Data.Uploadable
{
    public class LoadHelper
    {
        public static ILoadable GetLoader(UploadTypes type)
        {
            ILoadable loader;
            
            switch (type)
            {
                case UploadTypes.Project:
                    loader = new ProjectUploader();
                    break;
                case UploadTypes.Attribute:
                    loader = new AttributeUploader();
                    break;
                case UploadTypes.Reac:
                    loader = new ReacUploader();
                    break;
                case UploadTypes.Parcel:
                    loader = new ParcelUploader();
                    break;
                case UploadTypes.RealPropertyEvent:
                    loader = new PropertyEventUploader();
                    break;
                case UploadTypes.Subsidy:
                    loader = new SubsidyUploader();
                    break;
                case UploadTypes.Comment:
                    loader = new CommentExporter();
                    break;
                default:
                    throw new ApplicationException(String.Format("{0} is not a valid upload type.", type));
            }

            return loader;

        }
    }
}
