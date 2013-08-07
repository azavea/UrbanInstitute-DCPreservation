create index PDP_Properties_Primary_PropertyID on PDP_Properties_Primary(PropertyID);
create clustered index PDP_Properties_Secondary_PropertyID on PDP_Properties_Secondary(PropertyID);
create clustered index Nychanis_Data_Idx on Nychanis_Data(IndicatorID, ResolutionID, TimeID, GeographyID);