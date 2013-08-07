using System;

namespace Furman.PDP.Data
{
    /// <summary>
    /// A base class that encapsulates the ability to sort on the Order field.
    /// </summary>
    public abstract class AbstractSortable : IComparable
    {
        /// <summary>
        /// The order this Category should appear in compared to other
        /// Categories.
        /// </summary>
        public object Order;

        /// <summary>
        /// Sorts the objects on the order field.
        /// </summary>
        /// <param name="obj"></param>
        /// <returns></returns>
        public int CompareTo(object obj)
        {
            AbstractSortable other = (AbstractSortable) obj;
            if (Order == null)
            {
                if (other.Order == null)
                {
                    return 0;
                }
                return -1;
            }
            return ((IComparable)Order).CompareTo(other.Order);
        }
    }
}