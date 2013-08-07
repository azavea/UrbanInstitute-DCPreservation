using System.Collections.Generic;

namespace Furman.PDP.Data
{
    /// <summary>
    /// This class holds the results of a query plus the metadata about the attributes of those results.
    /// </summary>
    public class ResultsWithMetadata<T>
    {
        /// <summary>
        /// How many results were there all together, this may be higher than
        /// Values.Count if we're using paging and this is holding only one page's results.
        /// </summary>
        public int TotalResults;
        /// <summary>
        /// The metadata for the attributes, sorted in the order they should appear
        /// in the table.
        /// </summary>
        public IList<T> Attrs;
        /// <summary>
        /// A list of the rows of aggregated results, sorted as requested.
        /// The elements in the value lists are in the same order as the Attrs collection.
        /// </summary>
        public IList<IList<object>> Values;

        /// <summary>
        /// Given a List, returns the appropriate range of values based on pagination information.
        /// </summary>
        /// <param name="values">The list which contains the desired paging subset</param>
        /// <param name="numPerPage">Number of results for the given page</param>
        /// <param name="page">Which page the range should represent.</param>
        /// <returns></returns>
        public static IList<IList<object>> GetPagedSubset(List<IList<object>>values, int numPerPage, int page)
        {
            // Return the whole list if there are no paging details, 
            // or the page/range is more than the entire result set
            IList<IList<object>> retVal = values;

            if ((numPerPage > 0) && (page > 0))
            {
                // Make sure not to try and GetRange with out of range values.
                int offset = numPerPage * (page - 1);
                if (offset < values.Count)
                {
                    int number = numPerPage;
                    if ((offset + number) > values.Count)
                    {
                        number = values.Count - offset;
                    }
                    retVal = values.GetRange(offset, number);
                }
                else
                {
                    // Return an empty list if there are no records at this page
                    retVal = new List<IList<object>>();
                }
                
            }

            return retVal;
        }
    }
}