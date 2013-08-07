using System.Collections.Generic;
using Azavea.Open.Common.Collections;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// This class holds the results of a query plus the metadata about the attributes of those results.
    /// </summary>
    public class PdbResultsWithMetadata : ResultsWithMetadata<PdbResultAttributeMetadata>
    {
        /// <summary>
        /// Uses the list of metadata to construct a lookup dictionary allowing
        /// you to get the index of any column by name.
        /// </summary>
        /// <returns>A dictionary of int indexes of the attributes keyed by attribute names.</returns>
        public IDictionary<string, int> GetIndexesByAttrID()
        {
            IDictionary<string, int> retVal = new CheckedDictionary<string, int>();
            for (int x = 0; x < Attrs.Count; x++)
            {
                retVal[Attrs[x].UID] = x;
            }
            return retVal;
        }

    }
}