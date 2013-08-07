namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// One of the legitimate values for an Attribute.  Usually used for
    /// Categorical (combo-box) displays.
    /// </summary>
    public class PdbAttributeValue
    {
        /// <summary>
        /// Name of the attribute this is a value for.
        /// </summary>
        public string AttributeName;
        /// <summary>
        /// Actual value the user can choose.
        /// </summary>
        public object Value;
        /// <summary>
        /// Values may be grouped by some sort of categorization.
        /// This may be null.
        /// </summary>
        public string Group;
    }
}