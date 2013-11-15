using System;
using FileHelpers;
using Urban.DCP.Data.Uploadable.Display;

namespace Urban.DCP.Data.Uploadable
{
    [DelimitedRecord(",")] 
    [IgnoreFirst(1)]
    public class Parcel: IDisplaySortable
    {

        public string NlihcId;
        /// <summary>
        /// Parcel record Identifier
        /// </summary>
        public string Ssl;
        /// <summary>
        /// Res/Non Res, single family, etc
        /// </summary>
        public string ParcelType;
        /// <summary>
        /// Parcel owner name
        /// </summary>
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string OwnerName;
        /// <summary>
        /// The type of ownership for this parcel
        /// </summary>
        public string OwnerType;
        /// <summary>
        /// Date when this ownership info took effect
        /// </summary>
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime? OwnerDate;
        /// <summary>
        /// Type of ownership
        /// </summary>
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public int? Units;
        public double? X;
        public double? Y;
        public string GetSortField()
        {
            return "OwnerDate";
        }
    }

    public class ParcelUploader: AbstractLoadable<Parcel>, ILoadable
    {
        public override UploadTypes UploadType
        {
            get { return UploadTypes.Parcel; }
        }
    }
}
