using System;
using FileHelpers;

namespace Urban.DCP.Data.Uploadable
{
    [DelimitedRecord(",")] 
    [IgnoreFirst(1)]
    public class Subsidy
    {
        public string NlihcId;
        /// <summary>
        /// Description of the status of the project for this program
        /// </summary>
        public string SubsidyActive;
        /// <summary>
        /// The name of the subsidy program
        /// </summary>
        public string ProgramName;
        /// <summary>
        /// Unknown
        /// </summary>
        public string SubsidyInfo;
        /// <summary>
        /// The contract number for this project and this program
        /// </summary>
        public string ContractNumber;
        /// <summary>
        /// The numbers of assisted units provided for under this program
        /// </summary>
        public int? UnitsAssist;
        /// <summary>
        /// The date which this project entered active status for this program
        /// </summary>
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime? ProgramActiveStart;
        /// <summary>
        /// The date which this project leaves active status for this program
        /// </summary>
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime? ProgramActiveEnd;
        /// <summary>
        /// The source program for this program
        /// </summary>
        public string SubsidyInfoSource;
        /// <summary>
        /// Notes on this projects participation in the program
        /// </summary>
        public string SubsidyNotes;
        /// <summary>
        /// Date when this program status was updated
        /// </summary>
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime? SubsidyUpdate;
    }

    public class SubsidyUploader: AbstractUploadable<Subsidy>, IUploadable
    {
        public override UploadTypes UploadType
        {
            get { return UploadTypes.Subsidy; }
        }
    }
}
