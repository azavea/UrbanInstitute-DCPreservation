using System.Collections.Generic;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// The minimal set of metadata necessary for the UI to render the
    /// criteria widget(s) for this attribute.
    /// </summary>
    public class PdbCriteriaAttributeMetadata : AbstractNamedSortable
    {
        /// <summary>
        /// Is this a property that can be queried on?
        /// </summary>
        public bool CanQuery;
        /// <summary>
        /// Is this a property that can be grouped by when querying?
        /// </summary>
        public bool CanGroup;
        /// <summary>
        /// Used for grouping related properties.
        /// </summary>
        public string Category;
        /// <summary>
        /// The order within the category
        /// </summary>
        public string CategoryOrder;
        /// <summary>
        /// A verbose description that can be offered to the user.
        /// </summary>
        public string Desc;
        /// <summary>
        /// This may be removed, but it is used for if we have a "basic" and "advanced"
        /// query screen.
        /// </summary>
        public string Difficulty;
        /// <summary>
        /// A value that uniquely identifies this attribute.  Used for communicating between the
        /// UI and the back-end.
        /// </summary>
        public string UID;
        /// <summary>
        /// For displaying in a query input field, different than Name, which is displayed for presentation of results.
        /// </summary>
        public string QueryName;
        /// <summary>
        /// For numeric inputs, if there is a maximum value that the user cannot
        /// select above, this is it.
        /// </summary>
        public string Max;
        /// <summary>
        /// For numeric inputs, if there is a minimum value that the user cannot
        /// select below, this is it.
        /// </summary>
        public string Min;
        /// <summary>
        /// A "subgrouping" within categories that may be excessively large.
        /// Corresponds to "Grouping".
        /// </summary>
        public string SubCat;
        /// <summary>
        /// Refers to what type of control should be used to display the
        /// value, I.E. is it a "categorical" (pulldown or combobox type control)
        /// or "range" (min / max controls) etc.
        /// Corresponds to "AttributeType".
        /// </summary>
        public string UiType;
        /// <summary>
        /// Money, year, text, etc.
        /// </summary>
        public string ValType;
        /// <summary>
        /// The collection of values that are allowed for this attribute.
        /// </summary>
        public List<IDictionary<string, object>> Values;

        /// <summary>
        /// This constructor copies the necessary fields off the attribute.
        /// </summary>
        /// <param name="attr"></param>
        /// <param name="legitValues"></param>
        public PdbCriteriaAttributeMetadata(PdbAttribute attr, List<IDictionary<string,object>> legitValues)
        {
            CanQuery = attr.AllowFiltering;
            CanGroup = attr.AllowGroupBy;
            Category = attr.Category;
            CategoryOrder = attr.FilterAttrOrder;
            Desc = attr.Description;
            Difficulty = attr.Difficulty == null ? null : attr.Difficulty.ToString();
            UID = attr.UID;
            Name = attr.DisplayName;
            if (attr.MaxValue != null)
            {
                Max = attr.MaxValue == null ? null : attr.MaxValue.ToString();
            }
            if (attr.MinValue != null)
            {
                Min = attr.MinValue == null ? null : attr.MinValue.ToString();
            }
            Order = attr.FilterOrder;
            SubCat = attr.SubCategory;
            UiType = attr.UiType == null ? null : attr.UiType.ToString();
            ValType = attr.ValueType == null ? null : attr.ValueType.ToString();
            Values = legitValues;
            QueryName = attr.FilterName;
        }
    }
}