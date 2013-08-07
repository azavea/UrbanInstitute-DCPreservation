USE [Furman_PDP]
GO
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
    DROP TABLE [dbo].[Users]
GO

CREATE TABLE Users (
	Id int IDENTITY(1,1), 
	UserName nvarchar(100), 
	Password nvarchar(100), 
	Email nvarchar(255), 
    Name nvarchar(200), 
	Roles nvarchar(100)
	PRIMARY KEY (Id)
)
GO
CREATE INDEX USERS_IDX_USERNAME ON Users (UserName)
GO
