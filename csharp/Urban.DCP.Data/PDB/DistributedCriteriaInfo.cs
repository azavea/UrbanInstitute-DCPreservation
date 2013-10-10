using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Azavea.Open.DAO;
using Azavea.Open.DAO.Criteria;

namespace Urban.DCP.Data.PDB
{
    public class DistributedCriteriaInfo
    {
        public ClassMapping ClassMap;
        public IDaLayer DataAccessLayer;
        public DaoCriteria Criteria;
        public BooleanOperator HowToAdd;
    }
}
