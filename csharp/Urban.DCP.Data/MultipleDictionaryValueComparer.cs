using System;
using System.Collections.Generic;
using Azavea.Open.DAO.Criteria;

namespace Furman.PDP.Data
{
    /// <summary>
    /// Compares dictionaries given a list of SortOrders of the dictionary keys and directions
    /// to sort in.
    /// </summary>
    public class MultipleDictionaryValueComparer : IComparer<IDictionary<string, object>>
    {
        private readonly IEnumerable<SortOrder> Sorts;
        /// <summary>
        /// Compares dictionaries given a list of SortOrders of the dictionary keys and directions
        /// to sort in.
        /// </summary>
        /// <param name="sorts">The keys to sort on, in priority order.</param>
        public MultipleDictionaryValueComparer(IEnumerable<SortOrder> sorts)
        {
            Sorts = sorts;
        }
        public int Compare(IDictionary<string, object> x, IDictionary<string, object> y)
        {
            int retVal = 0;
            foreach (SortOrder sort in Sorts)
            {
                IComparable xVal = (IComparable)x[sort.Property];
                IComparable yVal = (IComparable)y[sort.Property];
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
                    retVal = xVal.CompareTo(yVal);
                }
                if (retVal != 0)
                {
                    // Handle descending sorts.
                    if (sort.Direction == SortType.Desc)
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