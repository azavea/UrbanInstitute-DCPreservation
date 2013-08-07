namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// Types of data values for attributes.
    /// </summary>
    public enum PdbValueType
    {
        /// <summary>
        /// Address data, probably not including city/state.
        /// </summary>
        address,
        /// <summary>
        /// Plain old numeric data.
        /// </summary>
        integer,
        /// <summary>
        /// Dollars (and cents?)
        /// </summary>
        money,
        /// <summary>
        /// String / varchar data.
        /// </summary>
        text,
        /// <summary>
        /// Year-only date type.
        /// </summary>
        year
    }
}