using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using Azavea.Open.Common;
using Azavea.Database;
using Azavea.Open.DAO.SQL;
using FileHelpers;
using FileHelpers.Events;
using Urban.DCP.Data.PDB;

namespace Urban.DCP.Data.Uploadable
{
    public interface ILoadable
    {
        ImportResult Load(Stream s, User u );
        String Export();
    }

    public abstract class AbstractLoadable<T> where T: class, new()
    {
        internal static readonly FastDAO<T> _readDao =
            new FastDAO<T>(Config.GetConfig("PDP.Data"), "PDB");

        internal static readonly FastDAO<T> _writeDao =
            new FastDAO<T>(Config.GetConfig("PDP.Data"), "Admin");

        /// <summary>
        /// Is this dataset only available for export?
        /// </summary>
        public bool ReadOnly = false;

        /// <summary>
        /// The upload type of this dataset
        /// </summary>
        public abstract UploadTypes UploadType { get; }

        /// <summary>
        /// Called before import-ready rows are saved to the database.  Default
        /// action is a no op.
        /// </summary>
        /// <param name="trans"></param>
        /// <param name="rows"></param>
        public virtual void PreProcess(SqlTransaction trans, IList<T> rows) {}

        /// <summary>
        /// Called after a successful import of a dataset. 
        /// If not overridden by an implementing class, no op.  If the process
        /// will be modifiying database values, the caller is encouraged to 
        /// use the provided transaction, which will be committed or rolled
        /// back with the main import.  An unhandled exception will cause
        /// the import to fail and be rolled back
        /// </summary>
        public virtual void PostProcess(SqlTransaction trans, IList<T> rows) {}

        // Helper method for inserting unqiue values from an import attribute to the
        // attribute values table.  A common use case from post-process implementations
        internal static void InsertUnique(SqlTransaction trans, IEnumerable<T> rows, 
            Func<T, string> selector, string attr )
        {
            PdbAttributesHelper._attrValDao.Insert(trans,
                rows.Select(selector)
                    .Distinct()
                    .Where(name => !String.IsNullOrEmpty(name))
                    .Select(name => new PdbAttributeValue {AttributeName = attr, Value = name})
                );
        }

        /// <summary>
        /// Import from a class defined csv file.  Remove all existing
        /// records in the target data set, load new rows and archive
        /// the records for restore points
        /// </summary>
        /// <param name="data"></param>
        /// <param name="user"></param>
        /// <returns></returns>
        public ImportResult Load(Stream data, User user)
        {
            if (ReadOnly) return null;

            var reader = new StreamReader(data);
            var csv = reader.ReadToEnd();
           
            var engine = new FileHelperEngine<T> {ErrorMode = ErrorMode.SaveAndContinue};
            var rows = engine.ReadString(csv);
            var results = new ImportResult{ ImportCount= rows.Length, Errors = engine.ErrorManager};

            if (results.Errors.ErrorCount == 0)
            {
                var trans = new SqlTransaction((AbstractSqlConnectionDescriptor)_writeDao.ConnDesc);
                try
                {
                    // Refresh the data if successfull 
                    PreProcess(trans, rows);
                    _writeDao.DeleteAll(trans);
                    _writeDao.Insert(trans, rows);
                    PostProcess(trans, rows);
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

        /// <summary>
        /// Generate csv as string from target data set
        /// </summary>
        /// <returns></returns>
        public String Export()
        {
            // Filehelpers doesn't support creating a header row for writing
            // the csv file, so use the class mapping order.  
            var header = string.Join(",", _readDao.ClassMap.AllDataColsInOrder.ToArray());
            var rows = _readDao.Get();
            var engine = new FileHelperEngine<T> {HeaderText = header};
            engine.AfterWriteRecord += EngineOnAfterWriteRecord;
            return engine.WriteString(rows);
        }

        /// <summary>
        /// Method which implementing classes can provide post-row creation
        /// changes for special cases when exporting.  Default implementation
        /// is a no-op.
        /// </summary>
        internal virtual void EngineOnAfterWriteRecord(EngineBase engine, 
            AfterWriteEventArgs<T> args) {}
    }
}