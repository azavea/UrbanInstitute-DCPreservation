using System;
using FileHelpers;

namespace Urban.DCP.Data.Uploadable
{
    [DelimitedRecord(",")] 
    [IgnoreFirst(1)]
    public class Reac
    {

        public string NlihcId;
        /// <summary>
        /// Date REAC score was given
        /// </summary>
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime ScoreDate;
        /// <summary>
        /// Total REAC Score (ScoreNum + ScoreLetter)
        /// </summary>
        public string Score;
        /// <summary>
        /// Number componenet of score
        /// </summary>
        public int ScoreNum;
        /// <summary>
        /// Letter component of score
        /// </summary>
        public string ScoreLetter;
    }

    public class ReacUploader: AbstractUploadable<Reac>, ILoadable
    {
        public override UploadTypes UploadType
        {
            get { return UploadTypes.Reac; }
        }
    }
}
