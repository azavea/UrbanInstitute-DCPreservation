namespace Urban.DCP.Data
{
    /// <summary>
    /// What roles exist within the system.
    /// </summary>
    public enum SecurityRole
    {
        /// <summary>
        /// All users on the internet have access.
        /// </summary>
        @public = 1,
        /// <summary>
        /// Higher level users have access to this.
        /// </summary>
        limited = 2,
        /// <summary>
        /// Network users are assigned to a recognized organization
        /// and may have special permissions.
        /// </summary>
        network = 4,
        /// <summary>
        /// SysAdmin users have access to everything.
        /// </summary>
        SysAdmin = 8
    }
}