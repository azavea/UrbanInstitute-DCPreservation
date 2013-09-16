USE [Urban_Institute]
GO

/****** Object:  Table [dbo].[UploadRevisions]    Script Date: 9/16/2013 11:34:45 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[UploadRevisions](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[type] [nchar](100) NULL,
	[date] [datetime] NULL,
	[data] [text] NULL,
	[userId] [int] NULL,
 CONSTRAINT [PK_UploadRevisions] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[UploadRevisions]  WITH CHECK ADD  CONSTRAINT [FK_UploadRevisions_Users] FOREIGN KEY([userId])
REFERENCES [dbo].[Users] ([Id])
GO

ALTER TABLE [dbo].[UploadRevisions] CHECK CONSTRAINT [FK_UploadRevisions_Users]
GO

