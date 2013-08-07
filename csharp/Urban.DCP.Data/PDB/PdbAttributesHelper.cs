using System;
using System.Collections.Generic;
using Azavea.Open.Common;
using Azavea.Open.Common.Collections;
using Azavea.Open.DAO.Criteria;

namespace Furman.PDP.Data.PDB
{
    /// <summary>
    /// This class handles reading the metadata tables about the Attributes in the PDB.
    /// </summary>
    public class PdbAttributesHelper
    {
        // TODO: Consider caching the attrib info if it turns out to be slow to
        // keep requerying.
        private static readonly Azavea.Database.FastDAO<PdbAttribute> _attrDao =
            new Azavea.Database.FastDAO<PdbAttribute>(Config.GetConfig("PDP.Data"), "PDB");
        private static readonly Azavea.Database.FastDAO<PdbAttributeValue> _attrValDao =
            new Azavea.Database.FastDAO<PdbAttributeValue>(Config.GetConfig("PDP.Data"), "PDB");

        /// <summary>
        /// Returns the metadata about the attributes that are columns on the primary
        /// table.  Does not include the allowed values for those columns that have them.
        /// </summary>
        /// <param name="entityType">Only Properties is supported.</param>
        /// <param name="userRoles">The roles the current user has.
        ///                         Only attributes they can see will be returned.</param>
        /// <returns>All the attribute metadata for the specified columns.</returns>
        public static IList<PdbAttribute> GetPrimaryTableColumns(
            PdbEntityType entityType, IEnumerable<SecurityRole> userRoles)
        {
            DaoCriteria crit = new DaoCriteria();
            crit.Expressions.Add(new EqualExpression("EntityType", entityType));
            crit.Expressions.Add(new EqualExpression("InPrimaryTable", true));
            return GetAttribRecords(crit, userRoles);
        }

        /// <summary>
        /// Gets all columns (visible to the user anyway) and includes the allowed
        /// values for columns that have entries in the Attribute_Values table.
        /// </summary>
        /// <param name="entityType">Only Properties is supported.</param>
        /// <param name="userRoles">The roles the current user has.
        ///                         Only attributes they can see will be returned.</param>
        /// <returns>All the attribute metadata for the specified columns.</returns>
        public static IList<PdbCategory> GetAttributesForClient(
            PdbEntityType entityType, IEnumerable<SecurityRole> userRoles)
        {
            IDictionary<string, IDictionary<string, IList<PdbAttribute>>> attrsByCatAndSub =
                new CheckedDictionary<string, IDictionary<string, IList<PdbAttribute>>>();
            IDictionary<string, IList<PdbAttribute>> attrsByCat =
                new CheckedDictionary<string, IList<PdbAttribute>>();

            DaoCriteria crit = new DaoCriteria();
            crit.Expressions.Add(new EqualExpression("EntityType", entityType));
            IList<PdbAttribute> attrs = GetAttribRecords(crit, userRoles);
            // Get all the attributes and split 'em up.  Put them either into the single
            // or double-nested dictionary depending on if they have subcategories.
            foreach (PdbAttribute attr in attrs)
            {
                IDictionary<string, IList<PdbAttribute>> catSubCats;
                IList<PdbAttribute> catAttrs;
                if (attrsByCatAndSub.ContainsKey(attr.Category))
                {
                    catSubCats = attrsByCatAndSub[attr.Category];
                    catAttrs = attrsByCat[attr.Category];
                }
                else
                {
                    catSubCats = new CheckedDictionary<string, IList<PdbAttribute>>();
                    catAttrs = new List<PdbAttribute>();
                    attrsByCatAndSub[attr.Category] = catSubCats;
                    attrsByCat[attr.Category] = catAttrs;
                }
                // Now either it has a subcategory, in which case it's filed there, or
                // it doesn't, and it's filed under the category directly.
                if (StringHelper.IsNonBlank(attr.SubCategory))
                {
                    IList<PdbAttribute> subcatList;
                    if (catSubCats.ContainsKey(attr.SubCategory))
                    {
                        subcatList = catSubCats[attr.SubCategory];
                    }
                    else
                    {
                        subcatList = new List<PdbAttribute>();
                        catSubCats[attr.SubCategory] = subcatList;
                    }
                    subcatList.Add(attr);
                }
                else
                {
                    catAttrs.Add(attr);
                }
            }
            // Now they're all split up, create the returnable object types.
            // Remember it is impossible for any of the collections to be empty, since we created
            // them all based on records we had.
            List<PdbCategory> retVal = new List<PdbCategory>();
            foreach (KeyValuePair<string, IDictionary<string, IList<PdbAttribute>>> kvp in attrsByCatAndSub)
            {
                IDictionary<string, IList<PdbAttribute>> subCatLists = kvp.Value;
                List<PdbSubCategory> subCats = new List<PdbSubCategory>();
                PdbAttribute anAttr = null;
                foreach (IList<PdbAttribute> subCatList in subCatLists.Values)
                {
                    subCats.Add(new PdbSubCategory(subCatList[0].SubCategory,
                        subCatList[0].FilterAttrOrder, SimplifyAndGetValues(subCatList)));
                    // save one indicator for the category info.
                    if (anAttr == null)
                    {
                        anAttr = subCatList[0];
                    }
                }
                if (anAttr == null)
                {
                    // subCatList and attrsByCat can't BOTH be empty or we wouldn't have this category.
                    anAttr = attrsByCat[kvp.Key][0];
                }
                retVal.Add(new PdbCategory(anAttr.Category, anAttr.FilterCatOrder,
                    SimplifyAndGetValues(attrsByCat[kvp.Key]), subCats));
            }
            retVal.Sort();
            return retVal;
        }

        private static IList<PdbAttribute> GetAttribRecords(
            DaoCriteria crit, IEnumerable<SecurityRole> userRoles)
        {
            return GetAttribRecords(crit, userRoles, false);
        }

        private static IList<PdbAttribute> GetAttribRecords(
            DaoCriteria crit, IEnumerable<SecurityRole> userRoles, bool addExtraCols)
        {
            IList<PdbAttribute> retVal = new List<PdbAttribute>();
            // We have to post-process the roles because the required role could be anything
            // but the user role could just be "SysAdmin" so there's no easy way to have the DB
            // filter that for us.
            IList<PdbAttribute> colsForAllRoles = _attrDao.Get(crit);

            foreach (PdbAttribute col in colsForAllRoles)
            {
                // null required role is never shown to anyone.
                if (col.RequiredRole != null)
                {
                    foreach (SecurityRole role in userRoles)
                    {
                        if ((role & col.RequiredRole) != 0 || role == SecurityRole.SysAdmin)
                        {
                            // User can see this one, no need to check the other roles.
                            retVal.Add(col);
                            break;
                        }
                    }
                }
            }

            // Lat/Long/Id should not be in attribute metadata - you cannot search on it.
            if (addExtraCols)
            {
                // Lat, Long and ID need to be in every search, no matter the role.  We are using their
                // ColMapped name, not their table name
                PdbAttribute extra = new PdbAttribute();
                extra.Name = "Lat";
                retVal.Add(extra);

                extra = new PdbAttribute();
                extra.Name = "Lon";
                retVal.Add(extra);

                extra = new PdbAttribute();
                extra.Name = "UID";
                retVal.Add(extra);
            }
            return retVal;
        }

        /// <summary>
        /// Gets all the attributes, without values, as a dictionary keyed by attribute display name.
        /// </summary>
        /// <param name="entityType">Only Properties is supported.</param>
        /// <param name="userRoles">The roles the current user has.
        ///                         Only attributes they can see will be returned.</param>
        /// <returns>All the attributes visible to someone with these roles.</returns>
        public static IDictionary<string, PdbAttribute> GetAttributesDictionary(PdbEntityType entityType,
                                                                                IEnumerable<SecurityRole> userRoles)
        {
            DaoCriteria crit = new DaoCriteria();
            crit.Expressions.Add(new EqualExpression("EntityType", entityType));
            IList<PdbAttribute> attrList = GetAttribRecords(crit, userRoles, true);
            IDictionary<string, PdbAttribute> retVal = new CheckedDictionary<string, PdbAttribute>();
            foreach (PdbAttribute attr in attrList)
            {
                retVal[attr.UID] = attr;
            }
            return retVal;
        }

        private static List<PdbCriteriaAttributeMetadata> SimplifyAndGetValues(IList<PdbAttribute> attrs)
        {
            List<PdbCriteriaAttributeMetadata> retVal = new List<PdbCriteriaAttributeMetadata>();
            DaoCriteria valCrit = new DaoCriteria();
            foreach (PdbAttribute attr in attrs)
            {
                // As a performance tweak, only get values for categorical attributes,
                // since those are the only ones (at the moment) that have values in
                // the attribute_values table.
                List<IDictionary<string, object>> legitValues = null;
                if (attr.HasValueList())
                {
                    valCrit.Expressions.Clear();
                    valCrit.Expressions.Add(new EqualExpression("AttributeName", attr.Name));
                    IList<PdbAttributeValue> values = _attrValDao.Get(valCrit);
                    legitValues = new List<IDictionary<string, object>>();
                    foreach (PdbAttributeValue val in values)
                    {
                        // Since we're encoding this as json, we want a short encoding.
                        Dictionary<string, object> strippedValue = new Dictionary<string, object>();
                        strippedValue["Value"] = val.Value;
                        strippedValue["Group"] = val.Group;
                        legitValues.Add(strippedValue);
                    }
                }
                // Copy the values we want to let the client know about into an object to
                // be returned.
                retVal.Add(new PdbCriteriaAttributeMetadata(attr, legitValues));
            }
            return retVal;
        }
    }
}