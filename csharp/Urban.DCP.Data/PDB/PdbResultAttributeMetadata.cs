using System;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// The minimal metadata necessary for the UI to render a table column.
    /// </summary>
    public class PdbResultAttributeMetadata : AbstractTableColumnMetadata
    {
        /// <summary>
        /// The non-shortened name that will be displayed to the user when.
        /// </summary>
        public string FilterName;
        /// <summary>
        /// What order should this attribute be displayed in within the
        /// "Long" (Detailed) view?
        /// </summary>
        public string LongOrder;
        /// <summary>
        /// What order should this attribute be displayed in within the
        /// "Short" (brief) view?
        /// </summary>
        public string ShortOrder;
        /// <summary>
        /// In result grids, is this attribute sortable?  Corrisponds to inPrimaryTable (sortable).
        /// </summary>
        public bool NotSortable;
        /// <summary>
        /// A value that uniquely identifies this attribute.  Used for communicating between the
        /// UI and the back-end.
        /// </summary>
        public string UID;
        /// <summary>
        /// This constructor pulls the necessary fields off the attribute object.
        /// </summary>
        /// <param name="attr"></param>
        public PdbResultAttributeMetadata(PdbAttribute attr)
        {
            Name = attr.DisplayName;
            FilterName = attr.FilterName;
            ValType = attr.ValueType == null ? null : attr.ValueType.ToString();
            Order = attr.TableViewOrder;
            LongOrder = attr.LongViewOrder;
            ShortOrder = attr.ShortViewOrder;
            OnByDefault = attr.ShowByDefault ?? false;
            NotSortable = !attr.InPrimaryTable;  //This attribute is not sortable if it is not in the primary table
            UID = attr.UID;
        }

        /// <summary>
        /// This constructor lets you specify the name and type, and one order.
        /// ShowByDefault will be true.
        /// </summary>
        /// <param name="uid">Unique identifier of this attribute.</param>
        /// <param name="name">Display name.</param>
        /// <param name="valType">Type of the value (a PdbValueType.ToString()).</param>
        /// <param name="order">Order it should be displayed in all three views
        /// <param name="notSortable"></param>
        ///                     relative to the other attributes.</param>
        public PdbResultAttributeMetadata(string uid, string name, string valType, string order, bool notSortable)
        {
            UID = uid;
            Name = name;
            ValType = valType;
            Order = order;
            LongOrder = order;
            ShortOrder = order;
            NotSortable = notSortable;
            OnByDefault = true;
        }

        public override string ToString()
        {
            return UID + " (" + Name + ")";
        }
    }
}