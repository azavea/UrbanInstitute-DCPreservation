namespace Urban.DCP.Data.PDB
{
    /// <summary>
    /// The type of data that is being dealt with regarding filtering
    /// and displaying
    /// </summary>
    public enum PdbEntityType
    {
        /// <summary>
        /// Property data.
        /// </summary>
        Properties,
        /// <summary>
        /// Physical Condition attributes
        /// </summary>
        Reac,
        /// <summary>
        /// Events related to real property: sales & foreclosures
        /// </summary>
        RealProperty,
        /// <summary>
        /// Subsidy programs a project might participate in
        /// </summary>
        Subsidy
    }
}