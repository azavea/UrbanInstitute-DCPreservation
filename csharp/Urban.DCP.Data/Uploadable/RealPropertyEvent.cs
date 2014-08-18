using System;
using FileHelpers;
using Urban.DCP.Data.Uploadable.Display;

namespace Urban.DCP.Data.Uploadable
{
    [DelimitedRecord(",")] 
    [IgnoreFirst(1)]
    public class RealPropertyEvent: IDisplaySortable
    {

        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public string NlihcId;
        /// <summary>
        /// Parcel record Identifier
        /// </summary>
        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public string Ssl;
        /// <summary>
        /// Date when this event was recorded
        /// </summary>
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public DateTime? EventDate;
        /// <summary>
        /// Key for type of event: Property Sale, Foreclosure Notice,
        ///  Foreclosure Outcome
        /// </summary>
        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public string EventType;
        /// <summary>
        /// Detailed description of the event type
        /// </summary>
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string EventDescription;

        public string GetSortField()
        {
            return "EventDate";
        }
    }

    public class PropertyEventUploader: AbstractLoadable<RealPropertyEvent>, ILoadable
    {
        public override UploadTypes UploadType
        {
            get { return UploadTypes.RealPropertyEvent; }
        }
    }
}
