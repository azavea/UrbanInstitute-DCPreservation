using System;

namespace Furman.PDP.Data
{
    public class UserResultMetadata
    {
        /// <summary>
        /// The name that will be displayed to the user.
        /// </summary>
        public string Name;
        /// <summary>
        /// Money, year, text, etc.
        /// </summary>
        public string ValType;
        /// <summary>
        /// In result grids, is this attribute shown by default?
        /// </summary>
        public bool OnByDefault;
        /// <summary>
        /// A value that uniquely identifies this attribute.  Used for communicating between the
        /// UI and the back-end.
        /// </summary>
        public string UID;
        /// <summary>
        /// Constructor to create a metadata object for user results
        /// </summary>
        /// <param name="uid">A unique identifier that ties the display column to a db column</param>
        /// <param name="name">The display name</param>
        /// <param name="valType">The rendered value type of this value</param>
        /// <param name="onByDefault">Should the be visible by default?</param>
        public UserResultMetadata(string uid, string name, string valType, bool onByDefault)
        {
            UID = uid;
            Name = name;
            ValType = valType;
            OnByDefault = onByDefault;
        }
    }
}
