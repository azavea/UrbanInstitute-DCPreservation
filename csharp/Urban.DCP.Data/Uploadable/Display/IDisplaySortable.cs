namespace Urban.DCP.Data.Uploadable.Display
{
    /// <summary>
    /// DAO types must specify the sort field for generic
    /// sort during query
    /// </summary>
    public interface IDisplaySortable
    {
        string GetSortField();
    }
}
