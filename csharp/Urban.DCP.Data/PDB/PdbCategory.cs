using System.Collections.Generic;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// A category consists of a display name, a sort order, and a group of subcategories.
    /// </summary>
    public class PdbCategory : AbstractNamedSortable
    {
        /// <summary>
        /// Every category has a collection of subcategories.
        /// </summary>
        public List<PdbSubCategory> SubCats;
        /// <summary>
        /// Every category can also have attributes directly.
        /// </summary>
        public List<PdbCriteriaAttributeMetadata> Attrs;

        /// <summary>
        /// Construct it with the list of children, and one attribute to pull the name and order off of.
        /// </summary>
        public PdbCategory(string name, object order, List<PdbCriteriaAttributeMetadata> attrs, List<PdbSubCategory> subcats)
        {
            Name = name;
            Order = order;
            Attrs = attrs;
            Attrs.Sort();
            SubCats = subcats;
            SubCats.Sort();
        }
    }
}