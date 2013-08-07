using Azavea.Open.Common;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// Represents a single attribute from the PDP data, that lives in
    /// either the primary or secondary table.  The description of the attribute
    /// comes dynamically from the PDP_Attributes table.
    /// </summary>
    public class PdbAttribute
    {
        /// <summary>
        /// Tells what kind of data the attribute is for.  Currently only properties are supported.
        /// </summary>
        public PdbEntityType EntityType;
        /// <summary>
        /// A value that uniquely identifies this attribute.  Used for communicating with the
        /// UI.
        /// </summary>
        public string UID
        {
            // In practice, we'll use the attribute name, but we don't want to make it
            // obvious to the UI that this is also the database column name.  Also this
            // leaves us flexible in case they change the data format again.
            get { return Name; }
        }
        /// <summary>
        /// The column name within the primary table or "AttrName"
        /// within the secondary table.  Known as "Attribute" in the table.
        /// </summary>
        public string Name;
        /// <summary>
        /// The name that will be displayed to the user when display (table).
        /// </summary>
        public string DisplayName;
        /// <summary>
        /// The name that will be displayed to the user when querying.
        /// </summary>
        public string FilterName;
        /// <summary>
        /// A verbose description that can be offered to the user.
        /// </summary>
        public string Description;
        /// <summary>
        /// Used for grouping related properties.
        /// </summary>
        public string Category;
        /// <summary>
        /// A "subgrouping" within categories that may be excessively large.
        /// Corresponds to "Grouping".
        /// </summary>
        public string SubCategory;
        /// <summary>
        /// What order should this attribute's category be displayed in for the criteria list?
        /// </summary>
        public string FilterCatOrder;
        /// <summary>
        /// What order should this attribute's subcategory be displayed in for the criteria list
        /// within the category?
        /// </summary>
        public string FilterSubCatOrder;
        /// <summary>
        /// What order should this attribute be displayed in for the criteria list within the 
        /// category and subcategory?
        /// </summary>
        public string FilterAttrOrder;
        /// <summary>
        /// What order should this attribute be displayed in within the
        /// Table view?
        /// </summary>
        public string TableViewOrder;
        /// <summary>
        /// What order should this attribute be displayed in within the
        /// "Long" (Detailed) view?
        /// </summary>
        public string LongViewOrder;
        /// <summary>
        /// What order should this attribute be displayed in within the
        /// "Short" (brief) view?
        /// </summary>
        public string ShortViewOrder;
        /// <summary>
        /// This merges the three other filter order fields into a single one
        /// to allow simpler sorting.
        /// </summary>
        public string FilterOrder
        {
            get
            {
                // Nulls are replaced with "Z"s so they fall to the end.
                // Pad the digits so they are all 2 characters, zero prepended so they sort right
                return PadOrZ(FilterCatOrder) + "." + PadOrZ(FilterSubCatOrder) + "." + PadOrZ(FilterAttrOrder);
            }
        }
        /// <summary>
        /// Is this attribute in the primary, or secondary, table?
        /// Corresponds to "IsNative".
        /// </summary>
        public bool InPrimaryTable;
        /// <summary>
        /// Refers to what type of control should be used to display the
        /// value, I.E. is it a "categorical" (pulldown or combobox type control)
        /// or "range" (min / max controls) etc.
        /// Corresponds to "AttributeType".
        /// </summary>
        public PdbUiType? UiType;
        /// <summary>
        /// Money, year, text, etc.
        /// </summary>
        public PdbValueType? ValueType;
        /// <summary>
        /// For numeric inputs, if there is a minimum value that the user cannot
        /// select below, this is it.
        /// </summary>
        public long? MinValue;
        /// <summary>
        /// For numeric inputs, if there is a maximum value that the user cannot
        /// select above, this is it.
        /// </summary>
        public long? MaxValue;
        /// <summary>
        /// Is this a property that can be grouped by when querying?
        /// </summary>
        public bool AllowGroupBy;
        /// <summary>
        /// Is this a property that can be queried on?
        /// </summary>
        public bool AllowFiltering;
        /// <summary>
        /// The role the user must have in order to view / query / etc this attribute.
        /// Corresponds to "SecurityLevel"
        /// </summary>
        public SecurityRole? RequiredRole;
        /// <summary>
        /// In result grids, is this attribute shown by default?
        /// </summary>
        public bool? ShowByDefault;
        /// <summary>
        /// This may be removed, but it is used for if we have a "basic" and "advanced"
        /// query screen.
        /// </summary>
        public PdbDifficulty? Difficulty;

        /// <exclude/>
        public override string ToString()
        {
            return Name + " (" + DisplayName + ")";
        }

        /// <summary>
        /// Determines whether or not we should check the AttributeValues table for
        /// values for this attribute.
        /// </summary>
        /// <returns>true/false based primarily on the UiType.</returns>
        public bool HasValueList()
        {
            return (UiType == PdbUiType.autocomplete) || (UiType == PdbUiType.dropdown);
        }

        /// <summary>
        /// Takes a string order number and either pads it with 0's to make it 2 characters or returns a 'Z'
        /// </summary>
        /// <param name="value">Order to be modified</param>
        /// <returns>Z or padded Value with 0</returns>
        private string PadOrZ(string value)
        {
            string retVal = "Z";

            if (StringHelper.IsNonBlank(value))
            {
                // Pad this with 0s
                retVal = value.PadLeft(2, '0');
            }
            return retVal;
        }
    }
}