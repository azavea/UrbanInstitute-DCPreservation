namespace Furman.PDP.Data
{
    /// <summary>
    /// Base class for all the objects returned as metadata for table columns/attributes.
    /// </summary>
    public abstract class AbstractTableColumnMetadata : AbstractNamedSortable
    {
        /// <summary>
        /// Money, year, text, etc.
        /// </summary>
        public string ValType;
        /// <summary>
        /// In result grids, is this attribute shown by default?
        /// </summary>
        public bool OnByDefault = true;
    }
}