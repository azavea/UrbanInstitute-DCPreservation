using System;
using System.Collections.Generic;
using Furman.PDP.Data.PDB;
using NUnit.Framework;

namespace Furman.PDP.Data.Tests
{
    /// <exclude/>
    [TestFixture]
    public class AttributeTests
    {
        /// <exclude/>
        [Test]
        public void TestGetPrimaryMetadataForEveryone()
        {
            IList<PdbAttribute> cols = PdbAttributesHelper.GetPrimaryTableColumns(
                PdbEntityType.Properties, new SecurityRole[] {SecurityRole.@public});
            Assert.AreEqual(31, cols.Count, "Wrong number of primary table columns for all users.");
        }
        /// <exclude/>
        [Test]
        public void TestGetAllPrimaryMetadata()
        {
            IList<PdbAttribute> cols = PdbAttributesHelper.GetPrimaryTableColumns(
                PdbEntityType.Properties, new SecurityRole[] {SecurityRole.SysAdmin});
            Assert.AreEqual(32, cols.Count, "Wrong number of primary table columns for privileged users.");
        }

        /// <exclude/>
        [Test]
        public void TestGetAllMetadataWithValuesForEveryone()
        {
            IList<PdbCategory> cols = PdbAttributesHelper.GetAttributesForClient(
                PdbEntityType.Properties, new SecurityRole[] { SecurityRole.@public });
            AssertCategorizedAttributes(cols, 5, 23, 4, 14, "all users");
        }
        /// <exclude/>
        [Test]
        public void TestGetAllMetadataWithValues()
        {
            IList<PdbCategory> cols = PdbAttributesHelper.GetAttributesForClient(
                PdbEntityType.Properties, new SecurityRole[] { SecurityRole.SysAdmin });
            AssertCategorizedAttributes(cols, 5, 24, 4, 14, "privileged users");
        }

        private static void AssertCategorizedAttributes(ICollection<PdbCategory> cats,
            int numCats, int numCatAttrs, int numSubCats, int numSubCatAttrs, string userDesc)
        {
            Assert.AreEqual(numCats, cats.Count, "Wrong number of categories for " + userDesc);
            List<PdbSubCategory> subCats = new List<PdbSubCategory>();
            List<PdbCriteriaAttributeMetadata> catAttrs = new List<PdbCriteriaAttributeMetadata>();
            foreach (PdbCategory cat in cats)
            {
                subCats.AddRange(cat.SubCats);
                catAttrs.AddRange(cat.Attrs);
            }
            Assert.AreEqual(numSubCats, subCats.Count, "Wrong number of subcategories for " + userDesc);
            Assert.AreEqual(numCatAttrs, catAttrs.Count, "Wrong number of category attributes for " + userDesc);
            List<PdbCriteriaAttributeMetadata> attrs = new List<PdbCriteriaAttributeMetadata>();
            foreach (PdbSubCategory subCat in subCats)
            {
                attrs.AddRange(subCat.Attrs);
            }
            Assert.AreEqual(numSubCatAttrs, attrs.Count, "Wrong number of subcategory attributes for " + userDesc);
            AssertValues(attrs);
        }
        private static void AssertValues(IEnumerable<PdbCriteriaAttributeMetadata> attrs)
        {
            bool foundSome = false;
            foreach (PdbCriteriaAttributeMetadata attr in attrs)
            {
                if (attr.Values != null)
                {
                    foundSome = true;
                    Assert.Greater(attr.Values.Count, 0,
                        "Empty value collection, probably bad data.  Attr: " + attr);
                }
            }
            Assert.IsTrue(foundSome, "Failed to find any categorical attributes to verify values for.");
        }
    }
}
