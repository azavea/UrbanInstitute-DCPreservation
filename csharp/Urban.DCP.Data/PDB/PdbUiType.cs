namespace Urban.DCP.Data.PDB
{
    /// <summary>
    /// Types of UI options for displaying/querying attributes.
    /// </summary>
    public enum PdbUiType
    {
        /// <summary>
        /// Dropdown, listbox, combo box, that sorta thing.
        /// </summary>
        dropdown,
        /// <summary>
        /// Text box that allows anything to be entered.
        /// </summary>
        free,
        /// <summary>
        /// Combination min and max control(s) for numeric types.
        /// </summary>
        range,
        /// <summary>
        /// Similar to free, but uses a list of possible values to autocomplete for the user.
        /// </summary>
        autocomplete,
        /// <summary>
        /// Similar to free, but uses %wildcards% on whatever is entered in text box.
        /// </summary>
        wildcard,
        /// <summary>
        /// Range for date types.
        /// </summary>
        daterange
    }
}