using System;
using FileHelpers;

namespace Urban.DCP.Data.Uploadable
{
    public class EmptyStringToNull : ConverterBase
    {
        /// <summary>
        /// Use NULL for empty strings 
        /// </summary>
        /// <param name="sourceString"></param>
        /// <returns></returns>
        public override object StringToField(string sourceString)
        {
            return String.IsNullOrEmpty(sourceString.Trim()) ? null : sourceString;
        }
    }
}
