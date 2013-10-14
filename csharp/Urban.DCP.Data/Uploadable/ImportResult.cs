using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using FileHelpers;

namespace Urban.DCP.Data.Uploadable
{
    public class ImportResult
    {
        /// <summary>
        /// The successfully parsed records count
        /// </summary>
        public int ImportCount;     

        /// <summary>
        /// Errors reported in the import process
        /// </summary>
        public ErrorManager Errors;
    }
}
