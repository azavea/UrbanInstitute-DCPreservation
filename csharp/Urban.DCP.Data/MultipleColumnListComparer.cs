using System;
using System.Collections.Generic;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
using log4net;

namespace Furman.PDP.Data
{
    /// <summary>
    /// Compares dictionaries given a list of SortOrders of the dictionary keys and directions
    /// to sort in.
    /// </summary>
    public class MultipleColumnListComparer : IComparer<IList<object>>
    {
        protected ILog _log = LogManager.GetLogger(
            new System.Diagnostics.StackTrace().GetFrame(0).GetMethod().DeclaringType.Namespace);
        private readonly IEnumerable<KeyValuePair<int, SortType>> Sorts;
        /// <summary>
        /// Compares dictionaries given a list of SortOrders of the dictionary keys and directions
        /// to sort in.
        /// </summary>
        /// <param name="sorts">The keys to sort on, in priority order.</param>
        public MultipleColumnListComparer(IEnumerable<KeyValuePair<int, SortType>> sorts)
        {
            Sorts = sorts;
        }
        public int Compare(IList<object> x, IList<object> y)
        {
            int retVal = 0;
            foreach (KeyValuePair<int, SortType> sort in Sorts)
            {
                IComparable xVal = (IComparable)x[sort.Key];
                IComparable yVal = (IComparable)y[sort.Key];
                // Sort nulls as "lowest".
                if (xVal == null)
                {
                    if (yVal != null)
                    {
                        retVal = 1;
                    }
                }
                else
                {
                    if (yVal == null)
                    {
                        retVal = -1;
                    }
                    else
                    {
                        // These values are always the same type, except when "[No Value]" has
                        // been inserted by the PdbTwoTableHelper, in which case we may be
                        // comparing a string with an anything.  So, if the types don't match
                        // compare as strings.
                        if (!xVal.GetType().Equals(yVal.GetType()))
                        {
                            xVal = xVal.ToString();
                            yVal = yVal.ToString();
                        }
                        retVal = StringHelper.SmartComparer.Instance.Compare(xVal, yVal);
                    }
                }
                if (retVal != 0)
                {
                    // Handle descending sorts.
                    if (sort.Value == SortType.Desc)
                    {
                        retVal *= -1;
                    }
                    break;
                }
            }
            return retVal;
        }
    }
}