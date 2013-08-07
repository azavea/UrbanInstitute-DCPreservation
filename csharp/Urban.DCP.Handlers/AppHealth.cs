using Azavea.Open.Common;
using Azavea.Open.DAO;
using Azavea.Open.DAO.SQL;
using Azavea.Utilities.Common;
using Azavea.Utilities.SystemMetrics;

namespace Furman.PDP.Handlers
{
    /// <summary>
    /// Sets up
    /// </summary>
    public class AppHealth : HealthHandler
    {
        /// <summary>
        /// Creates custom metrics: 
        /// GeoServerIsRunningMetric - which does a layer
        /// description call to a geoserver.
        /// SqlServerIsRunningMetric - which opens a database connection to a sqlserver
        /// </summary>
        public AppHealth() : base("NYU_NYCHANIS")
        {
            const string server = "http://207.245.89.220:8080/geoserver/wms";
            const string ver = "1.1.1";
            const string layer = "fc:boroughs";
            AddMetric(new GeoServerIsRunningMetric(server, layer, ver));

            // Add metric that opens a sql server connection
            AbstractSqlConnectionDescriptor conn = (AbstractSqlConnectionDescriptor)ConnectionDescriptor.LoadFromConfig(new Config("PDP.Data"), "PDB", Hasher.Decrypt);  
            AddMetric(new DbConnectionMetric(conn));
        }
       
    }
}
