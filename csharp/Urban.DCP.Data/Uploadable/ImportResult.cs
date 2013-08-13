using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using FileHelpers;

namespace Urban.DCP.Data.Uploadable
{
    public class ImportResult<T>
    {
        /// <summary>
        /// The successfully parsed <T> records
        /// </summary>
        public T[] Records;

        /// <summary>
        /// Errors reported in the import process
        /// </summary>
        public ErrorManager Errors;
    }
}
