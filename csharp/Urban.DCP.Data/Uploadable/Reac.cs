using System;
using System.IO;
using Azavea.Open.Common;
using Azavea.Open.DAO.SQL;
using FileHelpers;
using Urban.DCP.Data.PDB;

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
        public DateTime Date;
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

    public class ReacUploader: AbstractUploadable<Reac>
    {
        public override UploadTypes UploadType
        {
            get { return UploadTypes.Reac; }
        }
    }
}
