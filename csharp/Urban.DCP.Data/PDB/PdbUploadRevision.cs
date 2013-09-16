using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
using Azavea.Open.DAO.SQL;
using FileHelpers;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using Urban.DCP.Data.Uploadable;
namespace Urban.DCP.Data.PDB

{
    public class PdbUploadRevision
    {
        private static readonly Azavea.Database.FastDAO<PdbUploadRevision> _urDao =
         new Azavea.Database.FastDAO<PdbUploadRevision>(Config.GetConfig("PDP.Data"), "PDB");
     
        public int Id;
        public String Type;
        public DateTime Date;
        public int UserId;

        // A visually, human readable identifier of the uniqueness of this dataset.
        // IE like github's commit id. (First 8 chars of sha1)
        public String Hash {
            get {
                byte[] bytes = new byte[Data.Length * sizeof(char)];
                System.Buffer.BlockCopy(Data.ToCharArray(), 0, bytes, 0, bytes.Length);

                SHA1CryptoServiceProvider sha1 = new SHA1CryptoServiceProvider();
                byte[] hash = sha1.ComputeHash(bytes);
                string delimitedHexHash = BitConverter.ToString(hash);
                return delimitedHexHash.Substring(0,11);
            }
        }
        [JsonIgnore]
        public String Data;

        public static void AddUploadRevision(UploadTypes type, String data, User u) {
            var ur = new PdbUploadRevision();
            ur.Type = type.ToString();
            ur.Data = data;
            ur.Date = DateTime.Now;
            ur.UserId = u.Id;
            _urDao.Insert(ur);
        }

        public String UserName
        {
            get
            {
                var user = UserHelper.GetById(UserId);
                if (user != null)
                {
                    return user.UserName;
                }
                else
                {
                    return "unknown";
                }
            }
        }

        public static PdbUploadRevision GetById(int uploadRevisionId)
        {
            return _urDao.GetFirst("Id", uploadRevisionId);
        }

        public static void RestoreRevision(int id, User u)
        {
            var ur = GetById(id);
            var type = (UploadTypes)Enum.Parse(typeof(UploadTypes), ur.Type);
            byte[] byteArray = System.Text.Encoding.UTF8.GetBytes(ur.Data);
            MemoryStream data = new MemoryStream(byteArray);

            switch (type)
            {
                case UploadTypes.Attribute:
                    Urban.DCP.Data.Uploadable.AttributeUploadable.LoadAttributes(data, u);
                    break;
                case UploadTypes.Project:
                    Urban.DCP.Data.Uploadable.Project.LoadProjects(data, u);
                    break;
                default:
                    throw new Exception("Unrecgonized revision type.");
            }

        }

        public static IList<PdbUploadRevision> GetUploadRevisions(UploadTypes type)
        {
            var crit = new DaoCriteria();
            crit.Expressions.Add(new EqualExpression("Type", type.ToString()));
            crit.Orders.Add(new SortOrder("Date", SortType.Asc));
       
            var revisions = _urDao.Get(crit );
            return revisions;
        }

    }
        
}