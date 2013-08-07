namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// The secondary table has a fixed layout, it is a key-value table.
    /// </summary>
    public class PdbSecondaryTableProperty {
        /// <summary>
        /// The value that corresponds to which primary table record this is a value for.
        /// </summary>
        public int ForeignKey;
        /// <summary>
        /// Name of the attribute (this may appear more than once if the record has multiple
        /// values for this attribute).
        /// </summary>
        public string AttributeName;
        /// <summary>
        /// Value for the attribute.
        /// </summary>
        public object Value;
    }
}