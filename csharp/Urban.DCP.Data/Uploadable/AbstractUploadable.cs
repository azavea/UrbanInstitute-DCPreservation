using System;
using System.IO;
using Azavea.Database;
using Azavea.Open.Common;
using Azavea.Open.DAO.SQL;
using FileHelpers;
using Urban.DCP.Data.PDB;

namespace Urban.DCP.Data.Uploadable
{
    public abstract class AbstractUploadable<T> where T: class, new()
    {
        internal static readonly FastDAO<T> _dao =
            new FastDAO<T>(Config.GetConfig("PDP.Data"), "PDB");

        public abstract UploadTypes UploadType { get; }

        public ImportResult Load(Stream data, User user)
        {
            var reader = new StreamReader(data);
            var csv = reader.ReadToEnd();
           
            var engine = new FileHelperEngine<T> {ErrorMode = ErrorMode.SaveAndContinue};
            var rows = engine.ReadString(csv);
            var results = new ImportResult{ ImportCount= rows.Length, Errors = engine.ErrorManager};

            if (results.Errors.ErrorCount == 0)
            {
                var trans = new SqlTransaction((AbstractSqlConnectionDescriptor)_dao.ConnDesc);
                try
                {
                    // Refresh the data if successfull 
                    _dao.DeleteAll(trans);
                    _dao.Insert(trans, rows);
                    trans.Commit();

                    PdbUploadRevision.AddUploadRevision(UploadType, csv, user);
                }
                catch (Exception)
                {
                    trans.Rollback();
                    throw;
                }
                
            }
            return results;
        }
    }
}