-- Migration to add id_Usuario_Tutor to Nino table
IF COL_LENGTH('dbo.Nino', 'id_Usuario_Tutor') IS NULL
BEGIN
    ALTER TABLE dbo.Nino ADD id_Usuario_Tutor INT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE dbo.Nino ADD CONSTRAINT FK_Nino_Usuario_Tutor 
    FOREIGN KEY (id_Usuario_Tutor) REFERENCES dbo.Usuario(id_Usuario);
    
    PRINT 'Column id_Usuario_Tutor added to Nino table.';
END
GO
