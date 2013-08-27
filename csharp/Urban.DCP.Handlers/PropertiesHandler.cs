using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Azavea.Open.Common;
using Azavea.Open.DAO.Criteria;
using Azavea.Web;
using Azavea.Web.Handler;
using Newtonsoft.Json.Linq;
using Urban.DCP.Data;
using Urban.DCP.Data.PDB;
using Azavea.Web.Exceptions;

namespace Urban.DCP.Handlers
{
    public class PropertiesHandler : BaseHandler
    {
        private const string ATTRIBUTE_KEY = "attr";
        private const string OPERATOR_KEY = "oper";
        private const string VALUE_KEY = "val";

        /// <summary>
        /// Enable response compression.
        /// </summary>
        public PropertiesHandler() : base(true)
        {
        }

        protected override void InternalGET(HttpContext context, HandlerTimedCache cache)
        {
            IList<SecurityRole> roles = UserHelper.GetUserRoles(context.User.Identity.Name);
            
            //Get the paging parameters...
            int page = WebUtil.ParseIntParam(context, "page");
            int pageSize = WebUtil.ParseIntParam(context, "pageSize");


            // Check to see if this is a csv export request.  Runs the normal query (with no paging).
            bool csv = false;
            WebUtil.ParseOptionalBoolParam(context, "csv", ref csv);
            
            User authUser = UserHelper.GetUser(context.User.Identity.Name);
            if (csv)
            {
                if (authUser == null || !authUser.EmailConfirmed)
                {
                    throw new AzaveaWebNotAuthorizedException("Insuffient privileges.");
                }
            }

            // If this is csv, we want all data - override any paging
            if (csv)
            {
                page = -1;
                pageSize = -1;
            }
            IList<IExpression> expressions = ParseExpressions(context);

            // Now get the ordering parameters, if specified.
            int sortCol = -1;
            WebUtil.ParseOptionalIntParam(context, "sortBy", ref sortCol);
            SortType? sortDir = null;
            if (sortCol >= 0)
            {
                // Default is ascending sort, passing false means descending.
                bool ascending = true;
                WebUtil.ParseOptionalBoolParam(context, "sortasc", ref ascending);
                sortDir = ascending ? SortType.Asc : SortType.Desc;
            }
            PdbTwoTableHelper dataHelper = new PdbTwoTableHelper(Config.GetConfig("PDP.Data"), "Properties", PdbEntityType.Properties);

            // Now get the grouping parameters, if specified.
            IList<string> groupBys = WebUtil.GetJsonStringArrayParam(context, "groupby", true);
            PdbResultsWithMetadata list;
            if ((groupBys != null) && (groupBys.Count > 0))
            {
                list = dataHelper.GroupedQuery(expressions, groupBys, sortCol, sortDir, roles, pageSize, page);
            }
            else
            {
                list = dataHelper.Query(expressions, sortCol, sortDir, roles, pageSize, page);
            }

            // If this was a csv request, format it and return it instead
            if (csv)
            {
                // Generate actual csv data, determine if this is groupby'd or not
                string export = dataHelper.ResultsAsCsv(list, ((groupBys != null) && (groupBys.Count > 0)));

                // Setup the response to handle this type of request
                context.Response.AddHeader("Content-Disposition", "attachment;filename=Furman_Center_SHIP_Properties.csv");
                context.Response.ContentType = "text/csv";
                context.Response.Write(export);
                return;
            }
            context.Response.Write(WebUtil.ObjectToJson(list));
        }

        public static IList<IExpression> ParseExpressions(HttpContext context)
        {
            /* Criteria should looks something like this
             *   [
             *     { 'attr': '', 'oper': '', 'val': '' }, ...
             *   ]
             */
            IList<IExpression> expressions = new List<IExpression>();
            var criteria = WebUtil.GetJsonObjectArrayParam(context, "criteria", true);
            
            if (criteria != null)
            {
                foreach (var criterion in criteria)
                {
                    expressions.Add(DictionaryToExpression(new Dictionary<string, object>
                        {
                            {"attr", criterion["attr"].Value<String>()},
                            {"oper", criterion["oper"].Value<String>()},
                            {"val", criterion["val"].Value<String>()},
                        }));
                }
            }
            return expressions;
        }

        /// <summary>
        /// Converts the parts of an expression into a FastDAO IExpression. 
        /// Supported operators: gt, lt, ge, le, eq
        /// </summary>
        /// <param name="expressionParts">IDictionary with the following keys:
        ///     "a" for the Attribute name
        ///     "o" for the Operator
        ///     "v" for the Value</param>
        /// <returns>A FastDAO IExpression</returns>
        private static IExpression DictionaryToExpression(IDictionary<string, object> expressionParts)
        {
            if (expressionParts == null) 
            {
                throw new ArgumentNullException("expressionParts", "Cannot convert null to SQL expression");
            }
            if (!expressionParts.ContainsKey(ATTRIBUTE_KEY))
            {
                throw new ArgumentException("Missing the [" + ATTRIBUTE_KEY + "] key from the expression parts. Cannot convert to SQL expression", "expressionParts");
            }
            if (!expressionParts.ContainsKey(OPERATOR_KEY))
            {
                throw new ArgumentException("Missing the [" + OPERATOR_KEY + "] key from the expression parts. Cannot convert to SQL expression", "expressionParts");
            }
            if (!expressionParts.ContainsKey(VALUE_KEY))
            {
                throw new ArgumentException("Missing the [" + VALUE_KEY + "] key from the expression parts. Cannot convert to SQL expression", "expressionParts");
            }
            
            IExpression retVal;
            string attr = (string)expressionParts[ATTRIBUTE_KEY];
            string oper = (string)expressionParts[OPERATOR_KEY];
            object val = expressionParts[VALUE_KEY];

            // Supported Operator Values: gt, lt, ge, le, eq, lk
            switch (oper)
            {
                case "eq":
                    if (val is IList)
                    {
                        retVal = new PropertyInListExpression(attr, (IEnumerable)val);
                    }
                    else 
                    {
                        retVal = new EqualExpression(attr, val);
                    }
                    break;
                case "gt":
                    retVal = new GreaterExpression(attr, val);
                    break;
                case "lt":
                    retVal = new LesserExpression(attr, val);
                    break;
                case "ge":
                    retVal = new LesserExpression(attr, val, false);
                    break;
                case "le":
                    retVal = new GreaterExpression(attr, val, false);
                    break;
                case "lk":
                    retVal = new LikeExpression(attr, "%" + val + "%");
                    break;
                default:
                    throw new ArgumentException("Cannot convert unsupported operator to SQL expression: " + oper);
            }

            return retVal;
        }
    }
}
