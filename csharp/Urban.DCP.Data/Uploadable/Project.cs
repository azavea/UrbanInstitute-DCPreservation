using System;
using System.IO;
using Azavea.Open.Common;
using Azavea.Open.DAO.SQLServer;
using Azavea.Open.DAO.SQL;
using FileHelpers;

namespace Urban.DCP.Data.Uploadable
{
    /// <summary>
    /// The basic preservation project entity
    /// </summary>
    [IgnoreFirst(1)]
    [DelimitedRecord(",")]
    public class Project
    {
        private static readonly Azavea.Database.FastDAO<Project> _projectDao =
            new Azavea.Database.FastDAO<Project>(Config.GetConfig("PDP.Data"), "PDB");

        public string Id;
        public string Status;
        public string Subsidized;
        public string Category;
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string Name;
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string Address;
        public string City;
        public string State;
        public string Zip;
        public int? TotalUnits;
        public int? MinAssistedUnits;
        public int? MaxAssistedUnits;

        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime? OwnershipEffectiveDate;

        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string OwnerName;
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string OwnerType;
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string ManagerName;
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string ManagerType;
        
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime? EarliestSubsidyEnd;
        
        [FieldConverter(ConverterKind.Date, "MM/dd/yyyy")] 
        public DateTime? LatestSubsidyEnd;
        public string Ward;
        public string Anc; // Advisory Neighborhood Commission
        public string PoliceArea;
        public string ClusterId;
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string ClusterName;
        public string CensusTract;
        public double? X;
        public double? Y;
        public double? Lat;
        public double? Lon;
        [FieldQuoted('"', QuoteMode.OptionalForRead)]
        public string StreetViewUrl;
        public string ImageUrl;
        
        /// <summary>
        /// L
        /// </summary>
        /// <returns></returns>
        public static ImportResult<Project> LoadProjects(Stream data)
        {
            var engine = new FileHelperEngine<Project> {ErrorMode = ErrorMode.SaveAndContinue};
            var projects = engine.ReadStream(new StreamReader(data));
            var results = new ImportResult<Project>{Records = projects, Errors = engine.ErrorManager};

            if (results.Errors.ErrorCount == 0)
            {
                var trans = new SqlTransaction((AbstractSqlConnectionDescriptor)_projectDao.ConnDesc);
                try
                {
                    _projectDao.Insert(trans, results.Records);
                    trans.Commit();
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    throw;
                }
                
            }
            return results;
        }
    }

 
}
