using System;
using FileHelpers;
using Urban.DCP.Data.Uploadable.Display;

namespace Urban.DCP.Data.Uploadable
{
    [DelimitedRecord(",")] 
    [IgnoreFirst(1)]
    public class Reac: IDisplaySortable 
    {

        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public string NlihcId;
        /// <summary>
        /// Date REAC score was given
        /// </summary>
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public DateTime ScoreDate;
        /// <summary>
        /// Total REAC Score (ScoreNum + ScoreLetter)
        /// </summary>
        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public string Score;
        /// <summary>
        /// Number componenet of score
        /// </summary>
        public int ScoreNum;
        /// <summary>
        /// Letter component of score
        /// </summary>
        [FieldQuoted('"', QuoteMode.OptionalForRead)] 
        public string ScoreLetter;

        public string GetSortField()
        {
            return "ScoreDate";
        }
    }

    public class ReacUploader: AbstractLoadable<Reac>, ILoadable
    {
        public override UploadTypes UploadType
        {
            get { return UploadTypes.Reac; }
        }
    }
}
