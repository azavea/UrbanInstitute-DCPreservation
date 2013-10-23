using System;
using System.Linq;
using System.Collections.Generic;
using Azavea.Open.DAO;
using Azavea.Open.DAO.Criteria;
using Azavea.Open.DAO.SQL;
using FileHelpers;
using Urban.DCP.Data.PDB;
using Urban.DCP.Data.Uploadable.Display;

namespace Urban.DCP.Data.Uploadable
{
    [DelimitedRecord(",")] 
    [IgnoreFirst(1)]
    public class Subsidy: IDisplaySortable 
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

        public string GetSortField()
        {
            return "ProgramActiveStart";
        }
    }

    public class SubsidyUploader: AbstractUploadable<Subsidy>, ILoadable
    {
        public override UploadTypes UploadType
        {
            get { return UploadTypes.Subsidy; }
        }

        public override void PostProcess(SqlTransaction trans, IList<Subsidy> rows)
        {
            // Add unique program and agency names to the attribute value table
            var cols = _dao.ClassMap.AllDataColsByObjAttrs;
            var program = cols["ProgramName"];
            var agency = cols["SubsidyInfoSource"];

            PdbAttributesHelper._attrValDao.Delete(trans, new DaoCriteria(
                new PropertyInListExpression("AttributeName", new [] {program, agency})));

            InsertUnique(trans, rows, r => r.ProgramName, program);
            InsertUnique(trans, rows, r => r.SubsidyInfoSource, agency);
        }
    }
} 