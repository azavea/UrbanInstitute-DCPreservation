namespace Furman.PDP.Data
{
    /// <summary>
    /// This adds a user-friendly name attribute, and overrides tostring to show it.
    /// </summary>
    public abstract class AbstractNamedSortable : AbstractSortable
    {
        /// <summary>
        /// The name that will be displayed to the user.
        /// </summary>
        public string Name;

        public override string ToString()
        {
            return Name;
        }
    }
}