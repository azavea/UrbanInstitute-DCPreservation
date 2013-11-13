using Azavea.Database;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
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
        private static readonly FastDAO<PdbUploadRevision> _urDao =
         new FastDAO<PdbUploadRevision>(Config.GetConfig("PDP.Data"), "PDB");
       
        // Return only a reasonable amount of previous upload revisions
        private const int MaxRevisionsReturned = 15;

        public int Id;
        public String Type;
        public DateTime Date;
        public int UserId;

        // A visually, human readable identifier of the uniqueness of this dataset.
        // IE like github's commit id. (First 8 chars of sha1)
        public String Hash {
            get {
                var bytes = new byte[Data.Length * sizeof(char)];
                Buffer.BlockCopy(Data.ToCharArray(), 0, bytes, 0, bytes.Length);

                var sha1 = new SHA1CryptoServiceProvider();
                var hash = sha1.ComputeHash(bytes);
                var delimitedHexHash = BitConverter.ToString(hash);
                return delimitedHexHash.Substring(0,11);
            }
        }

        [JsonIgnore]
        public String Data;

        public static void AddUploadRevision(UploadTypes type, String data, User u) {
            var ur = new PdbUploadRevision
                {
                    Type = type.ToString(), 
                    Data = data, 
                    Date = DateTime.Now, 
                    UserId = u.Id
                };
            _urDao.Insert(ur);
        }

        public String UserName
        {
            get
            {
                var user = UserHelper.GetById(UserId);
                return user != null ? user.UserName : "unknown user";
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
            var byteArray = System.Text.Encoding.UTF8.GetBytes(ur.Data);
            var data = new MemoryStream(byteArray);

            var loader = LoadHelper.GetLoader(type);
            loader.Load(data, u);
        }

        public static IList<PdbUploadRevision> GetUploadRevisions(UploadTypes type)
        {
            var crit = new DaoCriteria();
            crit.Expressions.Add(new EqualExpression("Type", type.ToString()));
            crit.Orders.Add(new SortOrder("Date", SortType.Desc));
            crit.Limit = MaxRevisionsReturned;
       
            var revisions = _urDao.Get(crit);
            return revisions;
        }

    }
        
}