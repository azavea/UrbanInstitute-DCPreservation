using System.Collections.Generic;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// A subcategory consists of a display name, a sort order, and a group of attributes.
    /// </summary>
    public class PdbSubCategory : AbstractNamedSortable
    {
        /// <summary>
        /// Every subcategory has a collection of attributes.
        /// </summary>
        public List<PdbCriteriaAttributeMetadata> Attrs;

        public PdbSubCategory(string name, object order, List<PdbCriteriaAttributeMetadata> attrs)
        {
            Name = name;
            Order = order;
            Attrs = attrs;
            Attrs.Sort();
        }
    }
}