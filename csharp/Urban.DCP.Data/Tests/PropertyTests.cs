using System;
using System.Collections.Generic;
using System.Text;
using Azavea.Open.Common;
using Azavea.Open.DAO;
using Azavea.Open.DAO.Criteria;
using Furman.PDP.Data.PDB;
using NUnit.Framework;

namespace Furman.PDP.Data.Tests
{
    /// <exclude/>
    [TestFixture]
    public class PropertyTests
    {
        private readonly PdbTwoTableHelper _helper = new PdbTwoTableHelper(Config.GetConfig("PDP.Data"), "Properties",
                PdbEntityType.Properties);
        private readonly SecurityRole[] _publicRoles = new SecurityRole[] { SecurityRole.@public };
        [TestFixtureSetUp]
        public void Setup()
        {
            // Reset this so we always use the much more complicated logic in the unit tests.
            PdbTwoTableHelper.MAX_IDS_PER_PROPINLIST_EXPR = 0;
        }
        /// <exclude/>
        [Test]
        public void TestPrimaryTableClassMapForEveryone()
        {
            ClassMapping priMap = _helper.GetClassMapForPrimaryTable(new SecurityRole[] { SecurityRole.@public });
            // Should be number of cols in the DB attributes tables, but also one for the primary key, and
            // two for latlon.
            Assert.AreEqual(34, priMap.AllDataColsInOrder.Count,
                "Wrong number of primary table columns for all users.");
        }

        /// <exclude/>
        [Test]
        public void TestQueryNoExprsForEveryone()
        {
            // Should be number of cols in the DB attributes tables, but also one for the primary key.
            PdbResultsWithMetadata results = _helper.Query(null, new SecurityRole[] {SecurityRole.@public});
            Assert.AreEqual(612, results.Values.Count,
                "Wrong number of results for primary + secondary query for all users.");
            Assert.AreEqual(results.Values.Count, results.TotalResults,
                "Total results did not match the number of results returned.");
        }

        /// <exclude/>
        [Test]
        public void TestPrimaryTableQueryWithExprsForEveryone()
        {
            IExpression[] exprs = new IExpression[] {
                // This one's pretty straightforward, it is on the primary table.
                new LesserExpression("UnitCount", 25)
            };
            PdbResultsWithMetadata results = _helper.Query(exprs, new SecurityRole[] {SecurityRole.@public});
            // Should be number of cols in the DB attributes tables, but also one for the primary key.
            Assert.AreEqual(52, results.Values.Count,
                "Wrong number of results for primary + secondary query for all users.");
            Assert.AreEqual(results.Values.Count, results.TotalResults,
                "Total results did not match the number of results returned.");
        }

        /// <exclude/>
        [Test]
        public void TestSecondaryTableQueryWithExprsForEveryone()
        {
            IExpression[] exprs = new IExpression[] {
                // This one will require some magic since it is on the secondary table.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata results = _helper.Query(exprs, new SecurityRole[] {SecurityRole.@public});
            Assert.AreEqual(71, results.Values.Count,
                "Wrong number of results for primary + secondary query for all users.");
            Assert.AreEqual(results.Values.Count, results.TotalResults,
                "Total results did not match the number of results returned.");
        }

        /// <exclude/>
        [Test]
        public void TestSecondaryTableQueryWithTwoExprsForEveryone()
        {
            IExpression[] exprs = new IExpression[] {
                // This one will require some magic since it is on the secondary table.
                new PropertyInListExpression("Agency", new [] {"Division of Housing & Community Renewal", "U.S. Department of Housing and Urban Development"}),
                new EqualExpression("Portfolio", "LIHTC 4%")
            };
            PdbResultsWithMetadata results = _helper.Query(exprs, new SecurityRole[] { SecurityRole.@public });
            Assert.AreEqual(19, results.Values.Count,
                "Wrong number of results for primary + secondary query for all users.");
            Assert.AreEqual(results.Values.Count, results.TotalResults,
                "Total results did not match the number of results returned.");
        }

        /// <exclude/>
        [Test]
        public void TestPrimaryTableQueryWithOrExprsForEveryone()
        {
            IList<string> list = new List<string>();
            list.Add("BROOKLYN");
            list.Add("MANHATTAN");

            IExpression[] exprs = new IExpression[] {
                // This one's pretty straightforward, it is on the primary table.
                new PropertyInListExpression("Borough", list)
            };
            PdbResultsWithMetadata results = _helper.Query(exprs, new SecurityRole[] {SecurityRole.@public});
            Assert.AreEqual(374, results.Values.Count,
                "Wrong number of results for primary + secondary query for all users.");
            Assert.AreEqual(results.Values.Count, results.TotalResults,
                "Total results did not match the number of results returned.");
        }
        /// <exclude/>
        [Test]
        public void TestSecondaryTableQueryWithLikeExprsForEveryone()
        {

            IExpression[] exprs = new IExpression[] {
                // This one will require some magic since it is on the secondary table.
                new LikeExpression("Building Address", "%bush%")
            };
            PdbResultsWithMetadata results = _helper.Query(exprs, new SecurityRole[] {SecurityRole.@public});
            Assert.AreEqual(1, results.Values.Count ,
                "Wrong number of results for primary + secondary query for all users.");
        }
        /// <exclude/>
        [Test]
        public void TestSecondaryTableQueryWithOrExprsForEveryone()
        {
            IList<string> list = new List<string>();
            list.Add("Housing Finance Agency");
            list.Add("Division of Housing and Community Renewal");

            IExpression[] exprs = new IExpression[] {
                // This one will require some magic since it is on the secondary table.
                new PropertyInListExpression("Agency", list)
            };
            Assert.AreEqual(8, _helper.Query(exprs, new SecurityRole[] { SecurityRole.@public }).Values.Count,
                "Wrong number of results for primary + secondary query for all users.");
        }

        /// <exclude/>
        [Test]
        public void TestBothTableQueryWithExprsForEveryone()
        {
            IExpression[] exprs = new IExpression[] {
                // This one's pretty straightforward, it is on the primary table.
                new LesserExpression("Borough", "Brooklyn"),
                // This one will require some magic since it is on the secondary table.
                new EqualExpression("Agency", "Housing Development Corporation (HDC)")
            };
            Assert.AreEqual(0, _helper.Query(exprs, new SecurityRole[] { SecurityRole.@public }).Values.Count,
                "Wrong number of results for primary + secondary query for all users.");
        }

        /// <exclude/>
        [Test]
        public void TestPaging()
        {
            int numPerPage = 10;

            // Note that page numbering is 1-based.
            PdbResultsWithMetadata page1 = _helper.Query(null, _publicRoles, numPerPage, 1);
            PdbResultsWithMetadata page2 = _helper.Query(null, _publicRoles, numPerPage, 2);
            PdbResultsWithMetadata page50 = _helper.Query(null, _publicRoles, numPerPage, 50);

            // Should be the same number regardless of the page, but they shouldn't be the same.

            Assert.AreEqual(numPerPage, page1.Values.Count, "Wrong number of results for page 1.");
            Assert.AreEqual(numPerPage, page2.Values.Count, "Wrong number of results for page 2.");
            Assert.AreEqual(numPerPage, page50.Values.Count, "Wrong number of results for page 50.");
            int UIDIndex = -1;
            for (int x = 0; x < page1.Attrs.Count; x++)
            {
                if (page1.Attrs[x].UID.Equals("UID"))
                {
                    UIDIndex = x;
                    break;
                }
            }
            Assert.AreNotEqual(-1, UIDIndex, "Didn't find the UID column!");
            Assert.AreNotEqual(page1.Values[0][UIDIndex], page2.Values[0][UIDIndex], "Page 1 and 2 had the same first object.");
            Assert.AreNotEqual(page1.Values[0][UIDIndex], page50.Values[0][UIDIndex], "Page 1 and 50 had the same first object.");
            Assert.AreNotEqual(page2.Values[0][UIDIndex], page50.Values[0][UIDIndex], "Page 2 and 50 had the same first object.");
            Assert.Greater(page1.TotalResults, numPerPage, "Total results should have been higher than what is returned on page 1.");
            Assert.Greater(page2.TotalResults, numPerPage, "Total results should have been higher than what is returned on page 2.");
            Assert.Greater(page50.TotalResults, numPerPage, "Total results should have been higher than what is returned on page 50.");
        }

        [Test]
        public void TestPagingPastTheEnd()
        {
            // Should return nothing.
            int numPerPage = 10;
            PdbResultsWithMetadata page500 = _helper.Query(null, _publicRoles, numPerPage, 500);
            DumpResultsWithMetadata(page500);
            Assert.AreEqual(0, page500.Values.Count, "Page 500 should be past the end, so we should get no results.");
            Assert.Greater(page500.TotalResults, numPerPage, "Total results should have been higher than what is returned on page 500.");
        }
        [Test]
        public void TestOrderedPaging()
        {
            PdbResultsWithMetadata values = _helper.Query(null,
                10, null, _publicRoles, 2000, 1);
            AssertOrdering(values.Values, 10, SortType.Asc);
        }
        [Test]
        public void TestDescOrderedPaging()
        {
            PdbResultsWithMetadata values = _helper.Query(null,
                10, SortType.Desc, _publicRoles, 2000, 1);
            AssertOrdering(values.Values, 10, SortType.Desc);
        }
        [Test]
        public void TestSingleGroupBy()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus" },
                -1, null, _publicRoles, 0, 0);
            DumpAggregateResults(result);
            Assert.AreEqual(3, result.Values.Count, "Wrong number of grouped results.");
            Assert.AreEqual(result.Values.Count, result.TotalResults, "Total results should be the same as number received when no paging specified.");
        }
        [Test]
        public void TestDoubleGroupBy()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "Portfolio" },
                -1, null, _publicRoles, 0, 0);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(22, values.Count, "Wrong number of grouped results.");
        }
        [Test]
        public void TestTripleGroupByMultipleSecondary()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "Portfolio", "AffordabilityStatus" },
                -1, null, _publicRoles, 0, 0);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(30, values.Count, "Wrong number of grouped results.");
        }
        [Test]
        public void TestTripleGroupByMultiplePrimary()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "Lien or Arrears", "Portfolio" },
                -1, null, _publicRoles, 0, 0);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(45, values.Count, "Wrong number of grouped results.");
        }
        [Test]
        public void TestSingleGroupByWithPaging()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus" },
                -1, null, _publicRoles, 2, 2);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(1, values.Count, "Wrong number of grouped results.");
            Assert.Greater(result.TotalResults, result.Values.Count, "Total results should have been higher than what is returned on page 2.");
        }
        [Test]
        public void TestDoubleGroupByWithPaging()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "Portfolio" },
                -1, null, _publicRoles, 10, 2);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(10, values.Count, "Wrong number of grouped results.");
        }
        [Test]
        public void TestTripleGroupByWithPaging()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "U.S. Department of Housing and Urban Development")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "MLStatus", "AffordabilityStatus" },
                -1, null, _publicRoles, 10, 2);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(6, values.Count, "Wrong number of grouped results.");
        }
        [Test]
        public void TestOrderedSingleGroupByWithPaging()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Housing Development Corporation")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus" },
                3, null, _publicRoles, 2, 2);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(1, values.Count, "Wrong number of grouped results.");
            AssertOrdering(values, 3, SortType.Asc);
        }
        [Test]
        public void TestOrderedDoubleGroupByWithPaging()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "Department of Finance")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "Portfolio" },
                4, SortType.Desc, _publicRoles, 10, 2);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(10, values.Count, "Wrong number of grouped results.");
            AssertOrdering(values, 4, SortType.Desc);
        }
        [Test]
        public void TestOrderedTripleGroupByWithPaging()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "U.S. Department of Housing and Urban Development")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "MLStatus", "AffordabilityStatus" },
                3, SortType.Asc, _publicRoles, 10, 2);
            DumpAggregateResults(result);
            IList<IList<object>> values = result.Values;
            Assert.AreEqual(6, values.Count, "Wrong number of grouped results.");
            AssertOrdering(values, 3, SortType.Asc);
        }

        [Test]
        public void TestCsvExport()
        {
            PdbResultsWithMetadata values = _helper.Query(null,
                    10, null, _publicRoles, 2000, 1);

            string csv = _helper.ResultsAsCsv(values, false);
            Assert.IsNotEmpty(csv, "CSV Export should be populated.");

        }


        [Test]
        public void TestCsvExportWithGrouping()
        {
            IExpression[] exprs = new IExpression[] {
                // This is a secondary table attribute.
                new EqualExpression("Agency", "U.S. Department of Housing and Urban Development")
            };
            PdbResultsWithMetadata result = _helper.GroupedQuery(exprs,
                new string[] { "OwnerProfitStatus", "MLStatus", "AffordabilityStatus" },
                3, SortType.Asc, _publicRoles, 10, 2);

            string csv = _helper.ResultsAsCsv(result,true);
            Assert.IsNotEmpty(csv, "CSV Export should be populated.");

        }

        private static void AssertOrdering(IEnumerable<IList<object>> objs, int attr, SortType sortType)
        {
            IComparable lastVal = null;
            foreach (IList<object> obj in objs)
            {
                IComparable thisVal = (IComparable)obj[attr];
                if (lastVal != null)
                {
                    switch (sortType)
                    {
                        case SortType.Asc:
                            Assert.Less(lastVal.CompareTo(thisVal), 1,
                                        "Next value (" + thisVal + ") should be greater than or equal to the last one (" +
                                        lastVal + ").");
                            break;
                        case SortType.Desc:
                            Assert.Greater(lastVal.CompareTo(thisVal), -1,
                                        "Next value (" + thisVal + ") should be less than or equal to the last one (" +
                                        lastVal + ").");
                            break;
                        default:
                            throw new Exception("Unsupported sort type: " + sortType);
                    }
                }
                lastVal = thisVal;
            }
        }

        private static readonly int ColumnDisplayWidth = 20;

        private static void DumpAggregateResults(PdbResultsWithMetadata results)
        {
            if (results.Attrs == null)
            {
                Console.WriteLine("Null columns list on aggregated result.");
            }
            else
            {
                StringBuilder output = new StringBuilder();
                foreach (PdbResultAttributeMetadata colName in results.Attrs)
                {
                    output.Append(colName.Name.PadRight(ColumnDisplayWidth));
                }
                Console.WriteLine(output);
                DumpResultsWithMetadata(results);
            }
        }

        public static void DumpResults(IList<IDictionary<string, object>> results)
        {
            if (results == null)
            {
                Console.WriteLine("Null results list.");
            }
            else if (results.Count == 0)
            {
                Console.WriteLine("Empty results list.");
            }
            else
            {
                List<string> keysInOrder = new List<string>();
                keysInOrder.AddRange(results[0].Keys);
                keysInOrder.Sort();
                StringBuilder output = new StringBuilder();
                foreach (string key in keysInOrder)
                {
                    output.Append(("[" + key + "]").PadRight(ColumnDisplayWidth));
                }
                output.AppendLine();
                foreach (IDictionary<string, object> obj in results)
                {
                    foreach (string key in keysInOrder)
                    {
                        output.Append((obj[key] == null ? "<null>" : obj[key].ToString()).PadRight(ColumnDisplayWidth));
                    }
                    output.AppendLine();
                }
                Console.WriteLine(output);
            }
        }
        public static void DumpResultsWithMetadata<T>(ResultsWithMetadata<T> results)
        {
            if (results == null)
            {
                Console.WriteLine("Null results list.");
            }
            else
            {
                StringBuilder output = new StringBuilder();
                if (results.Attrs == null)
                {
                    output.Append("--- Null attribute metadata! ---");
                }
                else if (results.Attrs.Count == 0)
                {
                    output.Append("--- Empty attributes metadata. ---");
                }
                else
                {
                    foreach (T attr in results.Attrs)
                    {
                        output.Append(("[" + attr + "]").PadRight(ColumnDisplayWidth));
                    }
                }
                output.AppendLine();
                if (results.Values == null)
                {
                    output.Append("--- Null values collection! ---");
                }
                else if (results.Values.Count == 0)
                {
                    output.Append("--- Empty results list. ---");
                }
                else
                {
                    foreach (IList<object> resultRow in results.Values)
                    {
                        foreach (object val in resultRow)
                        {
                            output.Append((val == null ? "<null>" : val.ToString()).PadRight(ColumnDisplayWidth));
                        }
                        output.AppendLine();
                    }
                }
                Console.WriteLine(output);
            }
        }
    }
}
