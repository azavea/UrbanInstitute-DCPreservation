﻿using System.Web.Services;
using Azavea.Web.Handler;

namespace Urban.DCP.Handlers
{
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    public class Logger : LoggerHandler {}
}
