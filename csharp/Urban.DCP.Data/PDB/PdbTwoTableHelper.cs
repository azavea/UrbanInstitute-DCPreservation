using System;
using System.Collections;
using System.Collections.Generic;
using Azavea.Open.Common;
using Azavea.Open.Common.Collections;
using Azavea.Open.DAO;
using Azavea.Open.DAO.CSV;
using Azavea.Open.DAO.Criteria;
using Azavea.Open.DAO.SQL;
using Azavea.Utilities.Common;
using Azavea.Utilities.GeoUtilities;
using GeoAPI.Geometries;
using DictionaryDao = Azavea.Database.DictionaryDao;
using System.IO;
using Reprojector=Azavea.Open.Reprojection.Reprojector;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// Reads data from a primary and secondary table and returns it as though it were
    /// all from a single table.  Handles queries the same way.
    /// </summary>
    public class PdbTwoTableHelper
    {
        public static int MAX_IDS_PER_PROPINLIST_EXPR = 2000;
        private readonly string _primaryTableName;
        private readonly string _primaryTableIdColumn;
        private readonly string _primaryTableLatColumn;
        private readonly string _primaryTableLonColumn;

        private readonly string _secondaryTableName;
        private readonly string _secondaryTableForeignKeyColumn;
        private readonly string _secondaryTablePropertyColumn;
        private readonly string _secondaryTableValueColumn;
        /// <summary>
        /// The secondary table DAO is generic since the secondary table is a key-value
        /// table and always has the same column mapping regardless of user.
        /// </summary>
        private readonly FastDAO<PdbSecondaryTableProperty> SecondaryDao;
        private readonly IConnectionDescriptor ConnDesc;

        private readonly PdbEntityType _entityType;

        /// <summary>
        /// Key: Display name, Value: Column to sum, or * for a count.
        /// </summary>
        private readonly IList<KeyValuePair<string, string>> _aggregateColumns;

        private const string _csvHeaderText = "Subsidized Housing Information Project property-level data provided by " +
                                          "the Furman Center, retrieved from http://www.furmancenter.org/data/search on <%DATE%>. " +
                                          "Terms can be found at http://www.furmancenter.org/data/disclaimer/.";

        public PdbTwoTableHelper(Config cfg, string section, PdbEntityType type)
        {
            _entityType = type;
            ConnDesc = ConnectionDescriptor.LoadFromConfig(cfg, section, Hasher.Decrypt);
            _primaryTableName = cfg.GetParameter(section, "PrimaryTable");
            _primaryTableIdColumn = cfg.GetParameter(section, "PrimaryTableIdColumn");
            _primaryTableLonColumn = cfg.GetParameter(section, "PrimaryTableLonColumn");
            _primaryTableLatColumn = cfg.GetParameter(section, "PrimaryTableLatColumn");

            _secondaryTableName = cfg.GetParameter(section, "SecondaryTable");
            _secondaryTableForeignKeyColumn = cfg.GetParameter(section, "SecondaryTableForeignKeyColumn");
            _secondaryTablePropertyColumn = cfg.GetParameter(section, "SecondaryTablePropertyColumn");
            _secondaryTableValueColumn = cfg.GetParameter(section, "SecondaryTableValueColumn");
            SecondaryDao = new Azavea.Database.FastDAO<PdbSecondaryTableProperty>(ConnDesc,
                                                                                  GetClassMapForSecondaryTable());
            // Get the aggregate columns from the config file.
            _aggregateColumns = cfg.GetParametersAsList("AggregateColumns");
        }

        protected internal ClassMapping GetClassMapForSecondaryTable()
        {
            IList<ClassMapColDefinition> cols = new List<ClassMapColDefinition>();
            cols.Add(new ClassMapColDefinition("ForeignKey", _secondaryTableForeignKeyColumn, null));
            cols.Add(new ClassMapColDefinition("AttributeName", _secondaryTablePropertyColumn, null));
            cols.Add(new ClassMapColDefinition("Value", _secondaryTableValueColumn, null));
            return new ClassMapping(typeof (PdbSecondaryTableProperty).AssemblyQualifiedName, _secondaryTableName, cols);
        }

        protected internal ClassMapping GetClassMapForPrimaryTable(IEnumerable<SecurityRole> userAuth)
        {
            IList<PdbAttribute> attrs = PdbAttributesHelper.GetPrimaryTableColumns(_entityType, userAuth);
            IList<ClassMapColDefinition> cols = new List<ClassMapColDefinition>();
            bool primaryKeyDoneYet = false;
            bool latDoneYet = false;
            bool lonDoneYet = false;
            foreach (PdbAttribute attr in attrs)
            {
                if (attr.Name.Equals(_primaryTableLatColumn))
                {
                    cols.Add(new ClassMapColDefinition("Lat", attr.Name, null));
                    latDoneYet = true;
                }
                else if (attr.Name.Equals(_primaryTableLatColumn))
                {
                    cols.Add(new ClassMapColDefinition("Lon", attr.Name, null));
                    lonDoneYet = true;
                }
                else if (attr.Name.Equals(_primaryTableIdColumn))
                {
                    cols.Add(new ClassMapColDefinition("UID", attr.Name, null));
                    primaryKeyDoneYet = true;
                }
                else
                {
                    cols.Add(new ClassMapColDefinition(attr.UID, attr.Name, null));
                }
            }
            if (!primaryKeyDoneYet)
            {
                cols.Add(new ClassMapColDefinition("UID", _primaryTableIdColumn, null));
            }
            if (!latDoneYet)
            {
                cols.Add(new ClassMapColDefinition("Lat", _primaryTableLatColumn, null));
            }
            if (!lonDoneYet)
            {
                cols.Add(new ClassMapColDefinition("Lon", _primaryTableLonColumn, null));
            }
            return new ClassMapping(_entityType + "_Primary", _primaryTableName, cols, false);
        }

        /// <summary>
        /// Sorts out which expressions apply to the primary vs. the secondary table,
        /// and adds them (modified as necessary) to the criteria.  Also applies
        /// the sort order to the correct criteria.
        /// </summary>
        /// <param name="primaryCrit">Criteria to return the primary table records.</param>
        /// <param name="secondaryCritsGoHere">List of criteria that apply to the secondary table, 
        ///                                    one per attribute being queried.</param>
        /// <param name="expressions">List of expressions from the client.</param>
        /// <param name="attrDict">Collection of all the attributes we're dealing with, keyed by ID.</param>
        private static void DistributeExpressions(DaoCriteria primaryCrit,
                                                  ICollection<DaoCriteria> secondaryCritsGoHere, IEnumerable<IExpression> expressions,
                                                  IDictionary<string, PdbAttribute> attrDict)
        {
            if (expressions != null)
            {
                foreach (IExpression expr in expressions)
                {
                    if (expr is AbstractSinglePropertyExpression)
                    {
                        string propName = ((AbstractSinglePropertyExpression) expr).Property;
                        if (!attrDict.ContainsKey(propName))
                        {
                            throw new ArgumentOutOfRangeException("expressions", propName,
                                                                  "No attribute by this name is available to be queried.");
                        }
                        PdbAttribute attr = attrDict[propName];
                        if (!attr.AllowFiltering)
                        {
                            throw new ArgumentOutOfRangeException("expressions", propName,
                                                                  "No attribute by this name is available to be queried.");
                        }
                        if (attr.InPrimaryTable)
                        {
                            // Primary table is easy, just add the expression.
                            primaryCrit.Expressions.Add(expr);
                        }
                        else
                        {
                            // Secondary table is more complicated, we need to query it repeatedly
                            // to get the IDs that satisfy each expression separately, then only
                            // return IDs that match every expression.  So we just return a list of
                            // the criteria for each expression individually.

                            // This is because we need to say "name = blah AND value = blah"
                            DaoCriteria secondCrit = new DaoCriteria();
                            secondCrit.Expressions.Add(new EqualExpression("AttributeName", attrDict[propName].Name));

                            if (expr is EqualExpression)
                            {
                                EqualExpression typedExpr = (EqualExpression) expr;
                                secondCrit.Expressions.Add(new EqualExpression("Value", typedExpr.Value,
                                                                               typedExpr.TrueOrNot()));
                            }
                            else if (expr is GreaterExpression)
                            {
                                GreaterExpression typedExpr = (GreaterExpression) expr;
                                secondCrit.Expressions.Add(new GreaterExpression("Value", typedExpr.Value,
                                                                                 typedExpr.TrueOrNot()));
                            }
                            else if (expr is LesserExpression)
                            {
                                LesserExpression typedExpr = (LesserExpression) expr;
                                secondCrit.Expressions.Add(new LesserExpression("Value", typedExpr.Value,
                                                                                typedExpr.TrueOrNot()));
                            }
                            else if (expr is PropertyInListExpression)
                            {
                                PropertyInListExpression typedExpr = (PropertyInListExpression)expr;
                                secondCrit.Expressions.Add(new PropertyInListExpression("Value", typedExpr.Values,
                                                                                        typedExpr.TrueOrNot()));
                            }
                            else if (expr is LikeExpression)
                            {
                                LikeExpression typedExpr = (LikeExpression) expr;
                                secondCrit.Expressions.Add(new LikeExpression("Value", typedExpr.Value, 
                                                                                typedExpr.TrueOrNot()));
                            }
                            else
                            {
                                throw new NotSupportedException("You attempted to query in a way that is not supported.");
                            }
                            secondaryCritsGoHere.Add(secondCrit);
                        }
                    }
                    else
                    {
                        throw new NotSupportedException("You attempted to query in a way that is not supported.");
                    }
                }
            }
        }

        /// <summary>
        /// Performs a query against the primary and secondary tables and returns the results.
        /// </summary>
        /// <param name="expressions">List of expressions from a client perspective.  I.E. they are
        ///                           all written as though we were querying a single table, this
        ///                           method will handle determining which ones are against the primary
        ///                           vs. the secondary table and modifying them as necessary before
        ///                           performing the real query.</param>
        /// <param name="userAuth">Credentials the current user has.</param>
        /// <returns>A list of matching records.  They are also from a client perspective, so records
        ///          are a single dictionary with all fields (primary and secondary) in it.</returns>
        public PdbResultsWithMetadata Query(IEnumerable<IExpression> expressions,
                                            IEnumerable<SecurityRole> userAuth)
        {
            return Query(expressions, userAuth, 0, 0);
        }
        /// <summary>
        /// Performs a query against the primary and secondary tables and returns the results.
        /// This signature supports paging.
        /// </summary>
        /// <param name="expressions">List of expressions from a client perspective.  I.E. they are
        ///                           all written as though we were querying a single table, this
        ///                           method will handle determining which ones are against the primary
        ///                           vs. the secondary table and modifying them as necessary before
        ///                           performing the real query.</param>
        /// <param name="userAuth">Credentials the current user has.</param>
        /// <param name="numPerPage">How many records should be returned in a single page.
        ///                          0 (or less) means disable paging.</param>
        /// <param name="page">Which page of results do you want.  
        ///                    NOTE: this is 1-based (first page is 1, not 0).
        ///                    0 (or less) means disable paging.</param>
        /// <returns>A list of matching records.  They are also from a client perspective, so records
        ///          are a single dictionary with all fields (primary and secondary) in it.</returns>
        public PdbResultsWithMetadata Query(IEnumerable<IExpression> expressions,
                                            IEnumerable<SecurityRole> userAuth, int numPerPage, int page)
        {
            return Query(expressions, -1, null, userAuth, numPerPage, page);
        }

        /// <summary>
        /// Performs a query against the primary and secondary tables and returns the results.
        /// This signature supports paging and ordering the results.
        /// </summary>
        /// <param name="expressions">List of expressions from a client perspective.  I.E. they are
        ///                           all written as though we were querying a single table, this
        ///                           method will handle determining which ones are against the primary
        ///                           vs. the secondary table and modifying them as necessary before
        ///                           performing the real query.</param>
        /// <param name="orderCol">The column to sort by.</param>
        /// <param name="orderDir">The direction to sort, ignored if order is less than zero.  
        ///                        If null, assumed to be ascending.</param>
        /// <param name="userAuth">Credentials the current user has.</param>
        /// <param name="numPerPage">How many records should be returned in a single page.
        ///                          0 (or less) means disable paging.</param>
        /// <param name="page">Which page of results do you want.  
        ///                    NOTE: this is 1-based (first page is 1, not 0).
        ///                    0 (or less) means disable paging.</param>
        /// <returns>A list of matching records.  They are also from a client perspective, so records
        ///          are a single dictionary with all fields (primary and secondary) in it.</returns>
        public PdbResultsWithMetadata Query(IEnumerable<IExpression> expressions,
                                            int orderCol, SortType? orderDir, IEnumerable<SecurityRole> userAuth, int numPerPage, int page)
        {
            // Get the list of attributes we'll be dealing with.
            IDictionary<string, PdbAttribute> attrDict =
                PdbAttributesHelper.GetAttributesDictionary(_entityType, userAuth);

            // Setup the result object.
            PdbResultsWithMetadata retVal = new PdbResultsWithMetadata();
            // Create the empty result list.
            retVal.Values = new List<IList<object>>();
            // Create the metadata list.
            List<PdbResultAttributeMetadata> resultMetadata = new List<PdbResultAttributeMetadata>();
            foreach (PdbAttribute attrib in attrDict.Values)
            {
                resultMetadata.Add(new PdbResultAttributeMetadata(attrib));
            }
            resultMetadata.Sort();
            retVal.Attrs = resultMetadata;

            // Step 1: query the secondary table.  This is on the theory that the secondary table
            // lookup might give us only a few records back.  If this provides poor performance, some
            // options would be to query the primary first, query whichever one has more expressions
            // first, or something else.
            ClassMapping primaryMap = GetClassMapForPrimaryTable(userAuth);
            DaoCriteria primaryCrit = QuerySecondaryAndConstructRealPrimaryCriteria(attrDict, expressions, primaryMap);

            if (primaryCrit != null)
            {
                // If values have been passed for paging, set up the criteria appropriately.
                if ((numPerPage > 0) && (page > 0))
                {
                    primaryCrit.Start = numPerPage*(page - 1);
                    primaryCrit.Limit = numPerPage;
                }
                // Convert the order (if specified) to a SortOrder object for use with the criteria.
                if (orderCol >= 0)
                {
                    // You can only sort by primary attributes.
                    if (orderCol >= resultMetadata.Count)
                    {
                        throw new ArgumentOutOfRangeException("orderCol", orderCol,
                                                              "No attribute by this index is available to sort the results by.");
                    }
                    PdbAttribute attr = attrDict[resultMetadata[orderCol].UID];
                    if (attr.InPrimaryTable)
                    {
                        // Just add the order clause.
                        primaryCrit.Orders.Add(new SortOrder(attr.UID, orderDir ?? SortType.Asc));
                    }
                    else
                    {
                        throw new ArgumentOutOfRangeException("orderCol", orderCol,
                                                              "No attribute by this index is available to sort the results by.");
                    }
                }

                // Query for results...
                DictionaryDao primaryDao = new DictionaryDao(ConnDesc, primaryMap);

                // Step 2: Query for the primary records that match the criteria, joined with secondary
                // records.  This has to be separate from Step 1 because if the table has two secondary
                // records, but only one matches the secondary query, we still want to return the whole 
                // record including all its secondary records.
                LoadRecordsUsingSeparateQueries(primaryCrit, primaryDao, retVal);
            }
            return retVal;
        }
        /// <summary>
        /// Performs a query against the primary and secondary tables and returns the results.
        /// This signature queries for specific records.
        /// </summary>
        /// <param name="ids">List of IDs to query for.</param>
        /// <param name="userAuth">Credentials the current user has.</param>
        /// <returns>A list of matching records.  They are also from a client perspective, so records
        ///          are a single dictionary with all fields (primary and secondary) in it.</returns>
        public PdbResultsWithMetadata Query(IEnumerable ids,
                                            IEnumerable<SecurityRole> userAuth)
        {
            // Get the list of attributes we'll be dealing with.
            IDictionary<string, PdbAttribute> attrDict =
                PdbAttributesHelper.GetAttributesDictionary(_entityType, userAuth);

            // Setup the result object.
            PdbResultsWithMetadata retVal = new PdbResultsWithMetadata();
            // Create the empty result list.
            retVal.Values = new List<IList<object>>();
            // Create the metadata list.
            List<PdbResultAttributeMetadata> resultMetadata = new List<PdbResultAttributeMetadata>();
            foreach (PdbAttribute attrib in attrDict.Values)
            {
                resultMetadata.Add(new PdbResultAttributeMetadata(attrib));
            }
            resultMetadata.Sort();
            retVal.Attrs = resultMetadata;

            DaoCriteria primaryCrit = new DaoCriteria(new PropertyInListExpression("UID", ids));

            // Query for results...
            DictionaryDao primaryDao = new DictionaryDao(ConnDesc, GetClassMapForPrimaryTable(userAuth));

            // Step 2: Query for the primary records that match the criteria, joined with secondary
            // records.  This has to be separate from Step 1 because if the table has two secondary
            // records, but only one matches the secondary query, we still want to return the whole 
            // record including all its secondary records.
            LoadRecordsUsingSeparateQueries(primaryCrit, primaryDao, retVal);
            return retVal;
        }
        /// <summary>
        /// Convert a Pdb Property quert result into a CSV string.
        /// </summary>
        /// <param name="result">The result to convert</param>
        /// <param name="isGroupby">Is this the result for a group by query?</param>
        /// <returns>A string of comma seperated values, with header row and 
        ///          escaped with "" around strings</returns>
        public string ResultsAsCsv(PdbResultsWithMetadata result, bool isGroupby)
        {
            StringWriter writer = new StringWriter();

            List<ClassMapColDefinition> colMap = new List<ClassMapColDefinition>();
            colMap.Add(new ClassMapColDefinition("nothing", _csvHeaderText.Replace("<%DATE%>", DateTime.Now.ToShortDateString()), null));

            // Create some column mappings by looping through the attributes
            foreach (PdbResultAttributeMetadata attr in result.Attrs)
            {
                string name = attr.Name ?? attr.UID;

                /* For groupby'd queries, we have to dig deeper for the column name
                if (isGroupby)
                {
                    name = attr.Name;
                }*/

                // Only add it if we've got an exportable field
                if (name != null)
                {
                    colMap.Add(new ClassMapColDefinition(name, name, null));
                }

            }

            ClassMapping map = new ClassMapping("csv", "csv", colMap, false);
            DictionaryDao csvDao = new DictionaryDao(new CsvDescriptor(writer, CsvQuoteLevel.QuoteAlways), map);

            CheckedDictionary<string,object> dic;
            List<CheckedDictionary<string,object>> list = new List<CheckedDictionary<string, object>>();
            
            foreach (List<object>val in result.Values)
            {
                // Loop through the attributes we have, and get the values
                dic = new CheckedDictionary<string, object>();
                object value;
                for (int i = 0; i <= result.Attrs.Count; i++)
                {
                    // The extra column at the front means the column attribute count is ahead 
                    // of the value index by 1
                    int index = i - 1;

                    // Get name/val pairs 
                    string name = colMap[i].Column;
                    
                    // If the column name is "nothing" there is no value
                    if (colMap[i].Property == "nothing")
                    {
                        value = "";    
                    } else
                    {
                        value = val[index];
                    }
                    
                    // Some values are Lists, handle them 
                    if (index >= 0 && val[index] is List<object>)
                    {
                        value = "";
                        string sep = "";
                        foreach (string item in (List<object>)val[index])
                        {
                            value += sep + item;
                            sep = ";";
                        }
                        string v = value.ToString();
                        value = v.Trim();
                    }
                    dic.Add(name, value);

                }

                // Add the whole dictionary to a list of dictionaries
                list.Add(dic);
            }

            // Add these values to the csv writer
            csvDao.Insert(list);
            
            // Return our result
            return writer.ToString();
        }

        private void LoadRecordsUsingSeparateQueries(DaoCriteria primaryCrit, DictionaryDao primaryDao,
                                                     PdbResultsWithMetadata putEmHere)
        {
            IList<CheckedDictionary<string, object>> primaryRecords = primaryDao.Get(primaryCrit);
            // Wrapping it like this drops the paging and ordering.
            putEmHere.TotalResults = primaryDao.GetCount(new DaoCriteria(new CriteriaExpression(primaryCrit)));
            IDictionary<object, IList<object>> resultsById = new Dictionary<object, IList<object>>();
            foreach (CheckedDictionary<string,object> record in primaryRecords)
            {
                // Copy into a new dictionary in the list.
                IList<object> returnableRecord = new List<object>();
                foreach (PdbResultAttributeMetadata attrib in putEmHere.Attrs)
                {
                    // Secondary attributes don't exist in the primary table, so add nulls as placeholders.
                    returnableRecord.Add(record.ContainsKey(attrib.UID) ? record[attrib.UID] : null);
                }
                // This is kinda hacky, we always ad UID as the final column, even though it isn't
                // shown in the column metadata.  This allows unit testing to work.
                object uid = record["UID"];
                returnableRecord.Add(uid);
                putEmHere.Values.Add(returnableRecord);
                // Also save it keyed by ID so we can add secondary values to it.
                resultsById[uid] = returnableRecord;
            }
            if (resultsById.Count > 0)
            {
                Hashtable parameters = new Hashtable();
                parameters["resultsByID"] = resultsById;
                parameters["attribColsByID"] = putEmHere.GetIndexesByAttrID();
                // Since the ID list can be quite long, and the DB has a limit to the number of parameters
                // in an "IN" expression, process a group at a time.
                int batchSize = 500;
                DaoCriteria secondaryCrit = new DaoCriteria();
                List<object> ids = new List<object>(resultsById.Keys);
                for (int start = 0; start < resultsById.Count; start += batchSize)
                {
                    int count = batchSize;
                    if ((start + count) > resultsById.Count)
                    {
                        count = resultsById.Count - start;
                    }
                    secondaryCrit.Expressions.Clear();
                    secondaryCrit.Expressions.Add(new PropertyInListExpression("ForeignKey",
                                                                               ids.GetRange(start, count)));

                    SecondaryDao.Iterate(secondaryCrit, AddSecondaryValueToResult, parameters,
                                         "Loading secondary table attributes");
                }
            }
        }

        private static void AddSecondaryValueToResult(Hashtable parameters,
                                                      PdbSecondaryTableProperty secondaryValue)
        {
            IDictionary<object, IList<object>> resultsById = 
                (IDictionary<object, IList<object>>)parameters["resultsByID"];
            IDictionary<string, int> attribColsById =
                (IDictionary<string, int>) parameters["attribColsByID"];
            // First check that we know this secondary attribute, maybe it is one this
            // user doesn't have access to.
            if (attribColsById.ContainsKey(secondaryValue.AttributeName))
            {
                // Now add the secondary result to the dictionary.  If this isn't the first
                // value for that property, we need to store it as a list.
                IList<object> result = resultsById[secondaryValue.ForeignKey];
                int thisAttrCol = attribColsById[secondaryValue.AttributeName];

                object oldVal = result[thisAttrCol];
                if (oldVal != null)
                {
                    if (oldVal is IList<object>)
                    {
                        // This must be the 3rd or later object, the value is already a list, just add to it.
                        ((IList<object>) oldVal).Add(secondaryValue.Value);
                    }
                    else
                    {
                        // 2nd object, the first isn't a list yet so make a list and add both the
                        // first and second to it.
                        IList<object> list = new List<object>();
                        list.Add(oldVal);
                        list.Add(secondaryValue.Value);
                        result[thisAttrCol] = list;
                    }
                }
                else
                {
                    // Not there yet, so just add this value.
                    result[thisAttrCol] = secondaryValue.Value;
                }
            }
        }

        /// <summary>
        /// Performs a query against the primary and secondary tables and returns the results.
        /// This signature supports paging and ordering the results.
        /// </summary>
        /// <param name="expressions">List of expressions from a client perspective.  I.E. they are
        ///                           all written as though we were querying a single table, this
        ///                           method will handle determining which ones are against the primary
        ///                           vs. the secondary table and modifying them as necessary before
        ///                           performing the real query.</param>
        /// <param name="attrsToGroupBy">The attribute UIDs to group by.</param>
        /// <param name="orderCol">The column to sort by.</param>
        /// <param name="orderDir">The direction to sort, ignored if order is less than zero.  
        ///                        If null, assumed to be ascending.</param>
        /// <param name="userAuth">Credentials the current user has.</param>
        /// <param name="numPerPage">How many records should be returned in a single page.
        ///                          0 (or less) means disable paging.</param>
        /// <param name="page">Which page of results do you want.  
        /// <param name="orderCol"></param>
        ///                    NOTE: this is 1-based (first page is 1, not 0).
        ///                    0 (or less) means disable paging.</param>
        /// <returns>A list of matching records.  They are also from a client perspective, so records
        ///          are a single dictionary with all fields (primary and secondary) in it.</returns>
        public PdbResultsWithMetadata GroupedQuery(IEnumerable<IExpression> expressions,
                                                   IList<string> attrsToGroupBy, int orderCol, SortType? orderDir, IEnumerable<SecurityRole> userAuth, int numPerPage, int page)
        {
            if (attrsToGroupBy == null)
            {
                throw new ArgumentNullException("attrsToGroupBy", "Must pass attributes to group by.");
            }
            if (attrsToGroupBy.Count == 0)
            {
                throw new ArgumentException("Must pass a nonzero number of attributes to group by.");
            }

            IDictionary<string, PdbAttribute> attrDict =
                PdbAttributesHelper.GetAttributesDictionary(_entityType, userAuth);
            // Verify the requested attribs can in fact be grouped by.
            foreach (string attrID in attrsToGroupBy)
            {
                if (!attrDict[attrID].AllowGroupBy)
                {
                    throw new ArgumentOutOfRangeException("attrsToGroupBy",
                                                          "You attempted to group by an invalid attribute.");
                }
            }

            PdbResultsWithMetadata retVal = new PdbResultsWithMetadata();
            // This is setting up lookups back and forth between:
            // colsInOrder - int index to display name.
            // colsByID    - "ID" (either attribute UID or "*" to indicate the count column) to int index
            // When inserting into the results "records", we'll use the IDs as the keys.
            // The order by is also an "ID".
            // These columns are always going to be sortable in a grid view, so we are setting NotSortable = false
            // for everything that comes through here.
            IList<PdbResultAttributeMetadata> colsInOrder = new List<PdbResultAttributeMetadata>();
            IDictionary<string,int> colsByID = new CheckedDictionary<string, int>();
            foreach (string groupByID in attrsToGroupBy)
            {
                colsByID[groupByID] = colsInOrder.Count;
                colsInOrder.Add(new PdbResultAttributeMetadata(groupByID, attrDict[groupByID].DisplayName,
                                                               attrDict[groupByID].ValueType == null ? null : attrDict[groupByID].ValueType.ToString(),
                                                               colsInOrder.Count.ToString(), false));
            }
            foreach (KeyValuePair<string,string> aggCol in _aggregateColumns)
            {
                colsByID[aggCol.Value] = colsInOrder.Count;
                colsInOrder.Add(new PdbResultAttributeMetadata(colsInOrder.Count.ToString(), aggCol.Key,
                                                               PdbValueType.integer.ToString(),
                                                               colsInOrder.Count.ToString(), false));
            }
            retVal.Attrs = colsInOrder;
            // Since aggregation against secondary table stuff is not going to work in the DB, we'll
            // load all matching results and aggregate in memory.
            PdbResultsWithMetadata resultsToAggregate = Query(expressions, userAuth);

            IList<int> colsToGroupBy = new List<int>();
            // Figure out the columns we care about.
            IDictionary<string,int> resultIndexes = resultsToAggregate.GetIndexesByAttrID();
            foreach (string groupByID in attrsToGroupBy)
            {
                colsToGroupBy.Add(resultIndexes[groupByID]);
            }
            // Now, break the results out based on the columns to aggregate by.
            List<IList<object>> values = AggregateResults(attrDict,
                                                          resultsToAggregate.Values, resultIndexes, colsToGroupBy, 0);
            // Default to ascending sort if direction wasn't specified.
            SortAggregateResults(values, orderCol, orderDir ?? SortType.Asc, colsByID, attrsToGroupBy);
            // Since we happen to have them all in memory, set the total result count.
            retVal.TotalResults = values.Count;
            // Return the subset for the page/perPage requested
            retVal.Values = ResultsWithMetadata<PdbResultAttributeMetadata>.GetPagedSubset(values, numPerPage, page);


            return retVal;
        }

        /// <summary>
        /// Sorts the results first by the provided column id and direction, if any,
        /// then by the grouped by attributes.
        /// </summary>
        /// <param name="results"></param>
        /// <param name="orderCol">-1 means no order column was selected by the user.</param>
        /// <param name="orderDirection">Ascending or Descending, ignored if orderCol is less than zero.</param>
        /// <param name="colsByID"></param>
        /// <param name="attrsToGroupBy"></param>
        private static void SortAggregateResults(List<IList<object>> results,
                                                 int orderCol, SortType orderDirection, IDictionary<string, int> colsByID, IEnumerable<string> attrsToGroupBy)
        {
            // First assemble the list of actual column IDs (the keys to the result objects) we're sorting
            // by.
            List<KeyValuePair<int, SortType>> colSorts = new List<KeyValuePair<int, SortType>>();
            if (orderCol >= 0 && colsByID.Count > orderCol)
            {
                colSorts.Add(new KeyValuePair<int, SortType>(orderCol, orderDirection));
            }
            // Add the grouped by attributes as default sorts.
            foreach (string attrID in attrsToGroupBy)
            {
                // Only add it if the user hasn't already sorted by it.
                int colID = colsByID[attrID];
                if (colID != orderCol)
                {
                    colSorts.Add(new KeyValuePair<int, SortType>(colID, SortType.Asc));
                }
            }

            results.Sort(new MultipleColumnListComparer(colSorts));
        }

        /// <summary>
        /// Recursively performs the aggregation, adding its own attr value to the results before returning.
        /// </summary>
        /// <param name="attrDict">Attribute infos for the attributes in the aggregateUs lists.</param>
        /// <param name="aggregateUs"></param>
        /// <param name="resultColIndexes">The column indexes in the aggregateUs lists, keyed by attribute id.</param>
        /// <param name="colsToGroupBy">The columns in the aggregateUs lists to group by.</param>
        /// <param name="whichAttr">Which column are we grouping by on this pass?  
        ///                         I.E. this is an index into colsToGroupBy.</param>
        /// <returns></returns>
        private List<IList<object>> AggregateResults(IDictionary<string, PdbAttribute> attrDict,
                                                     ICollection<IList<object>> aggregateUs, 
                                                     IDictionary<string,int> resultColIndexes, IList<int> colsToGroupBy, int whichAttr)
        {
            List<IList<object>> retList = new List<IList<object>>();
            if (whichAttr >= colsToGroupBy.Count)
            {
                IList<object> retVal = new List<object>();
                
                foreach (KeyValuePair<string,string> aggCol in _aggregateColumns)
                {
                    // If it's a count the records, we can do that right away.
                    if (aggCol.Value == "*")
                    {
                        retVal.Add(aggregateUs.Count);
                    }
                    else
                    {
                        // Otherwise default it to zero.
                        // Has to be the correct kind of zero, or the cast later on will fail.
                        // You can cast an int to a long, but not if it's an object!  Go .net...
                        PdbValueType? valueType = attrDict[aggCol.Value].ValueType;
                        if (valueType == PdbValueType.integer)
                        {
                            retVal.Add(0L);
                        }
                        else if (valueType == PdbValueType.money)
                        {
                            retVal.Add(0.0);
                        }
                        else
                        {
                            throw new LoggingException(
                                "Bad configuration, attempting to aggregate a non-numeric attribute: " +
                                aggCol.Value);
                        }
                    }
                }

                // Nothing more to separate the results by, so aggregate.
                foreach (IList<object> obj in aggregateUs)
                {
                    for (int x = 0; x < _aggregateColumns.Count; x++)
                    {
                        KeyValuePair<string, string> aggCol = _aggregateColumns[x];
                        // Ignore count, we already did that one.
                        if (aggCol.Value != "*")
                        {
                            // Always ignore nulls.
                            object value = obj[resultColIndexes[aggCol.Value]];
                            if (value != null)
                            {
                                PdbValueType? valueType = attrDict[aggCol.Value].ValueType;
                                if (valueType == PdbValueType.integer)
                                {
                                    // Have to use Convert because you can't cast from an int OBJECT
                                    // to a long (though an int primitive to a long is fine.  Go .NET!)
                                    retVal[x] = (long)retVal[x] + Convert.ToInt64(value);
                                }
                                else if (valueType == PdbValueType.money)
                                {
                                    retVal[x] = (double)retVal[x] + Convert.ToDouble(value);
                                }
                            }
                        }
                    }
                }
                // Return a list of just the one value.
                retList.Add(retVal);
            }
            else
            {
                int myAttrIndex = colsToGroupBy[whichAttr];
                // We are not yet done splitting out records to aggregate, so split out and recurse.
                IDictionary<object,IList<IList<object>>> groupedRecsToAgg =
                    new Dictionary<object, IList<IList<object>>>();
                foreach (IList<object> record in aggregateUs)
                {
                    // Check that it exists, since secondary attributes are optional.
                    // Setting it to "No Value" is a hack due to the fact we can't use
                    // null as a key in a dictionary.
                    object thisVal = record[myAttrIndex] ?? "[None]";
                    if (thisVal is ICollection)
                    {
                        // Secondary attributes may have multiple values, and the customer is okay
                        // double- (or triple- etc) counting these.
                        foreach (object aVal in (ICollection)thisVal)
                        {
                            if (!groupedRecsToAgg.ContainsKey(aVal))
                            {
                                groupedRecsToAgg[aVal] = new List<IList<object>>();
                            }
                            groupedRecsToAgg[aVal].Add(record);
                        }
                    }
                    else
                    {
                        if (!groupedRecsToAgg.ContainsKey(thisVal))
                        {
                            groupedRecsToAgg[thisVal] = new List<IList<object>>();
                        }
                        groupedRecsToAgg[thisVal].Add(record);
                    }
                }
                // Now they're all split out, recurse to aggregate 'em.
                foreach (object key in groupedRecsToAgg.Keys)
                {
                    IList<IList<object>> recursedResults = AggregateResults(attrDict, 
                                                                            groupedRecsToAgg[key], resultColIndexes, colsToGroupBy, whichAttr + 1);
                    // Add the value of this attribute to all the results.
                    // Then add them all to the list to be returned.
                    foreach (IList<object> result in recursedResults)
                    {
                        result.Insert(0, key);
                        retList.Add(result);
                    }
                }
            }
            return retList;
        }

        /// <summary>
        /// Returns null if nothing matches the secondary criteria and you shouldn't bother
        /// to query, otherwise returns a primary criteria with the expressions and any
        /// generated expression based on the secondary values that matched.
        /// </summary>
        /// <returns></returns>
        private DaoCriteria QuerySecondaryAndConstructRealPrimaryCriteria(IDictionary<string, PdbAttribute> attrDict,
            IEnumerable<IExpression> expressions, ClassMapping primaryMap)
        {
            // Create the metadata list.
            List<PdbResultAttributeMetadata> resultMetadata = new List<PdbResultAttributeMetadata>();
            foreach (PdbAttribute attrib in attrDict.Values)
            {
                resultMetadata.Add(new PdbResultAttributeMetadata(attrib));
            }
            resultMetadata.Sort();

            DaoCriteria primaryCrit = new DaoCriteria();


            // Secondary table is a key value table, so we OR together a bunch of nested criteria.
            IList<DaoCriteria> secondaryCrits = new List<DaoCriteria>();

            // Parse the expressions from the json structure and put them on whichever table they belong to.
            DistributeExpressions(primaryCrit, secondaryCrits, expressions, attrDict);

            // Step 1: query the secondary table.  This is on the theory that the secondary table
            // lookup might give us only a few records back.  If this provides poor performance, some
            // options would be to query the primary first, query whichever one has more expressions
            // first, or something else.
            if (secondaryCrits.Count > 0)
            {
                // Step 2: Construct a sub-select clause to check if the primary table key 
                // is in the secondary table where clause, searching on "Attribute".
                IDaLayer daLayer = SecondaryDao.ConnDesc.CreateDataAccessLayer();
                string foreignKeyField = SecondaryDao.ClassMap.AllDataColsByObjAttrs["ForeignKey"];
                string idField = primaryMap.AllDataColsByObjAttrs["UID"];
                foreach (DaoCriteria secondaryCrit in secondaryCrits)
                {
                    SqlDaQuery daQuery = (SqlDaQuery) daLayer.CreateQuery(SecondaryDao.ClassMap, secondaryCrit);

                    // Get the actual sql query from our daLayer
                    string wholeQuery = daQuery.Sql.ToString();

                    // Grab the index for FROM since we want to use that part as our subselect
                    int fromIndex = wholeQuery.IndexOf(" FROM");

                    // Write the sub select part of the query from the parts we've cobbled together
                    string newQuery = "SELECT " + foreignKeyField +
                                      wholeQuery.Substring(fromIndex);

                    // Create the whole query now with the primary key in our sub query
                    string inExpression = idField + " IN (" + newQuery + ")";
                    IExpression expression = new HandWrittenExpression(inExpression, daQuery.Params);

                    // Add the expression to our primary criteria.
                    primaryCrit.Expressions.Add(expression);
                }
            }
            return primaryCrit;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="expressions"></param>
        /// <param name="roles"></param>
        /// <param name="minX">Meters (Web Mercator)</param>
        /// <param name="maxX">Meters (Web Mercator)</param>
        /// <param name="minY">Meters (Web Mercator)</param>
        /// <param name="maxY">Meters (Web Mercator)</param>
        /// <param name="minBoundsX">Meters (Web Mercator) Full Map Extent</param>
        /// <param name="maxBoundsX">Meters (Web Mercator) Full Map Extent</param>
        /// <param name="minBoundsY">Meters (Web Mercator) Full Map Extent</param>
        /// <param name="maxBoundsY">Meters (Web Mercator) Full Map Extent</param>
        /// <returns>A list of single and clustered locations, and the total properties meeting
        ///          the criteria within the full map extent.</returns>
        public PdbResultLocations QueryForLocations(IList<IExpression> expressions,
            IList<SecurityRole> roles, double minX, double maxX, double minY, double maxY, 
                                double minBoundsX, double maxBoundsX, double minBoundsY, double maxBoundsY)
        {
            PdbResultLocations retVal = new PdbResultLocations();
            // Get the list of attributes we'll be dealing with.
            IDictionary<string, PdbAttribute> attrDict =
                PdbAttributesHelper.GetAttributesDictionary(_entityType, roles);
            ClassMapping primaryMap = GetClassMapForPrimaryTable(roles);
            DaoCriteria crit = QuerySecondaryAndConstructRealPrimaryCriteria(attrDict, expressions, primaryMap);

            if (crit != null)
            {
                IPoint minLatLonPoint = Reprojector.ReprojectWebMercatorToWGS84(minX, minY);
                IPoint maxLatLonPoint = Reprojector.ReprojectWebMercatorToWGS84(maxX, maxY);

                // Expressions for full extent query, to get count
                IPoint min = Reprojector.ReprojectWebMercatorToWGS84(minBoundsX, minBoundsY);
                IPoint max = Reprojector.ReprojectWebMercatorToWGS84(maxBoundsX, maxBoundsY);

                crit.Expressions.Add(new GreaterExpression("Lat", min.Y));
                crit.Expressions.Add(new GreaterExpression("Lon", min.X));
                crit.Expressions.Add(new LesserExpression("Lat", max.Y));
                crit.Expressions.Add(new LesserExpression("Lon", max.X));
                DictionaryDao primaryDao = new DictionaryDao(ConnDesc, primaryMap);
                // Get a count of all properties in the max extent that meet this criteria.  We will only be returning
                //  a subset based on the bbox, but we want to know how many were returned and could be displayed on the map
                retVal.TotalMapResults = primaryDao.GetCount(crit);

 
                
                // Expressions for actual search bounding area
                crit.Expressions.Add(new GreaterExpression("Lat", minLatLonPoint.Y));
                crit.Expressions.Add(new GreaterExpression("Lon", minLatLonPoint.X));
                crit.Expressions.Add(new LesserExpression("Lat", maxLatLonPoint.Y));
                crit.Expressions.Add(new LesserExpression("Lon", maxLatLonPoint.X));

                // Query for results...
                primaryDao = new DictionaryDao(ConnDesc, GetClassMapForPrimaryTable(roles));

                IList<PdbPropertyLocation> allLocations = new List<PdbPropertyLocation>();
                // Step 2: Query for the primary records that match the criteria, joined with secondary
                // records.  This has to be separate from Step 1 because if the table has two secondary
                // records, but only one matches the secondary query, we still want to return the whole 
                // record including all its secondary records.
                primaryDao.Iterate(crit, GetLocations, allLocations, "Getting property locations.");
                


                // We don't use the signature that takes a bounding box, because we may have queried
                // way outside the bounds, so we'll let it figure out the bounding box of the actual
                // results.
                double width = maxX - minX;
                double height = maxY - minY;
                Aggregator<PdbPropertyLocation>.AggregationResult result =
                    Aggregator<PdbPropertyLocation>.AggregatePoints(allLocations,
                    minX, minY, minY, maxY,
                    // These are multiplied together, sqrted, then used as the starting grid size.
                    // Since we're in lat/lon and the resulting grid won't be even close to square,
                    // we're just using a magic number that works for us.
                    (width * height), Math.Pow(width * height, 0.2)/ 2000, 10);
                retVal.Singles = result.Singles;
                retVal.Clusters = new List<PdbClusterLocation>();
                foreach (Aggregator<PdbPropertyLocation>.DisplayPoint cluster in result.Multiples)
                {
                    // We don't want small clusters.
                    if (cluster.ItemCount < 4)
                    {
                        retVal.Singles.AddRange(cluster.Items);
                    }
                    else
                    {
                        PdbClusterLocation loc = new PdbClusterLocation();
                        loc.Keys = cluster.ItemKeys;
                        loc.X = cluster.X;
                        loc.Y = cluster.Y;
                        //loc.RadiusInMeters = cluster.ClusterRadius;
                        retVal.Clusters.Add(loc);
                    }
                }
                retVal.Clusters.Sort();
            }
            return retVal;
        }

        private static void GetLocations(IList<PdbPropertyLocation> putEmHere,
            CheckedDictionary<string, object> dataobject)
        {
            object latObj = dataobject["Lat"];
            object lonObj = dataobject["Lon"];

            // Ignore properties without a location.
            if ((latObj != null) && (lonObj != null))
            {
                IPoint webMercPoint = Reprojector.ReprojectWGS84ToWebMercator(
                    Convert.ToDouble(lonObj), Convert.ToDouble(latObj));
                PdbPropertyLocation loc = new PdbPropertyLocation();
                loc.Key = Convert.ToInt32(dataobject["UID"]);
                loc.Y = webMercPoint.Y;
                loc.X = webMercPoint.X;
                putEmHere.Add(loc);
            }
        }
    }
    public class PdbResultLocations
    {
        public List<PdbPropertyLocation> Singles;
        public List<PdbClusterLocation> Clusters;
        public int TotalMapResults;
    }

    public class PdbPropertyLocation : Aggregator<PdbPropertyLocation>.IKMeansItem
    {
        /// <summary>
        /// This should be in web mercator.
        /// </summary>
        public double X { get; set; }

        /// <summary>
        /// This should be in web mercator.
        /// </summary>
        public double Y { get; set; }

        public int Key { get; set; }

        public override string ToString()
        {
            return "Property at (" + Y + "," + X + "): " + Key;
        }
    }
    public class PdbClusterLocation : IComparable<PdbClusterLocation>
    {
        public IList<int> Keys;
        /// <summary>
        /// This should be in web mercator.
        /// </summary>
        public double X;
        /// <summary>
        /// This should be in web mercator.
        /// </summary>
        public double Y;

        public int CompareTo(PdbClusterLocation other)
        {
            int retVal = -1 * Keys.Count.CompareTo(other.Keys.Count);
            if (retVal == 0)
            {
                retVal = X.CompareTo(X);
            }
            if (retVal == 0)
            {
                retVal = Y.CompareTo(Y);
            }
            return retVal;
        }

        public override string ToString()
        {
            return "Cluster[" + Keys.Count + "] at (" + Y + "," + X + "): " + StringHelper.Join(Keys);
        }
    }
}