using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using FileHelpers;
using System.IO;
using Urban.DCP.Data.Uploadable;
using Urban.DCP.Data.PDB;
using Azavea.Open.DAO.SQL;

namespace Urban.DCP.Data.Uploadable
{
    [DelimitedRecord(",")]
    [IgnoreFirst(1)]
    public class AttributeUploadable
    
    {
        public String Entity;
        public String Attribute;
        public int? IsFilter; 
        public String OrderWithinCategory; 
        public String Category;
        public String CategoryOrder;
        public String SubCategory; 
        public String OrderWithinSubCategory;
        public int? IsNative; 
        public String TableDisplayName;
        public String FilterDisplayName;
        public String Description;
        public String UiType;
        public String ValueType;
        public int? MinValue; 
        public int? MaxValue;
        public int? GroupBy;
        public String RequiredRole;
        public int? DefaultTableDisplay;
        public int? TableColumnOrder;
        public int? ShortViewOrder; 
        public String LongViewOrder;
        public String Difficulty;
   
        public static ImportResult<AttributeUploadable> LoadAttributes(Stream data)
        {
            var engine = new FileHelperEngine<AttributeUploadable> { ErrorMode = ErrorMode.SaveAndContinue };
            StreamReader reader = new StreamReader(data);
            string csv = reader.ReadToEnd();
            var attributes = engine.ReadString(csv); 
            var results = new ImportResult<AttributeUploadable> { Records = attributes, Errors = engine.ErrorManager };

            var _attrDao = PdbAttributesHelper.getAttrDao();

            if (results.Errors.ErrorCount == 0)
            {
                var trans = new SqlTransaction((AbstractSqlConnectionDescriptor) _attrDao.ConnDesc);
                try
                {
                    _attrDao.DeleteAll(trans);
                    foreach (var r in results.Records) 
                    {
                        var newAttrRecord = MapUploadAttributeRecordToPdbAttribute(r);
                        _attrDao.Insert(trans, newAttrRecord);
                    }

                    PdbUploadRevision.AddUploadRevision(UploadTypes.Attribute, csv);
                    
                    trans.Commit();
                }
                catch (Exception)
                {
                    trans.Rollback();
                    throw;
                }

            }
            return results;
        }


        // There didn't seem to be fine grained controls over CSV order, and field inclusion/exclusion
        // in FileHelper, so it wasn't immediately obvious how to just parse into a PdbAttribute dao model
        // directly.  
        public static PdbAttribute MapUploadAttributeRecordToPdbAttribute(AttributeUploadable upload) {
            var daoModel =  new PdbAttribute();
            daoModel.EntityType = (PdbEntityType) Enum.Parse(typeof (PdbEntityType), upload.Entity);
            daoModel.Name = upload.Attribute;
            daoModel.AllowFiltering = upload.IsFilter == 1 ? true : false;
            daoModel.Category = upload.Category;
            daoModel.SubCategory = upload.SubCategory;
            daoModel.FilterCatOrder = upload.CategoryOrder;
            daoModel.FilterSubCatOrder = upload.OrderWithinSubCategory;
            daoModel.FilterAttrOrder = upload.OrderWithinCategory;
            daoModel.InPrimaryTable = upload.IsNative == 1 ? true : false;
            daoModel.DisplayName = upload.TableDisplayName;
            daoModel.FilterName = upload.FilterDisplayName;
            daoModel.Description = upload.Description;
            if (upload.UiType != null && upload.UiType != "")
            {
                daoModel.UiType = (PdbUiType)Enum.Parse(typeof(PdbUiType), upload.UiType);
            }
            if (upload.ValueType != null)
            {
                daoModel.ValueType = (PdbValueType)Enum.Parse(typeof(PdbValueType), upload.ValueType);
            }
            daoModel.MinValue = upload.MinValue;
            daoModel.MaxValue = upload.MaxValue;
            daoModel.AllowGroupBy = upload.GroupBy == 1 ? true : false;
            daoModel.RequiredRole = (SecurityRole)Enum.Parse(typeof(SecurityRole), upload.RequiredRole);
            daoModel.ShowByDefault = upload.DefaultTableDisplay == 1 ? true : false;
            daoModel.LongViewOrder = upload.LongViewOrder;
            daoModel.Difficulty = (PdbDifficulty)Enum.Parse(typeof(PdbDifficulty), upload.Difficulty);

            return daoModel;
        }
    }
}

