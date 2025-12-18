-- Migration 002: Add Username to Usuario Table
PRINT 'Executing Migration 002: Add Username to Usuario Table...';
GO

IF COL_LENGTH('dbo.Usuario', 'Username') IS NULL
BEGIN
    ALTER TABLE dbo.Usuario
    ADD Username NVARCHAR(100) NULL;
    
    -- Optional: Create a UNIQUE constraint for Username
    -- We use a filtered index to allow multiple NULLs if needed, 
    -- but usually usernames should be unique when present.
    CREATE UNIQUE INDEX UQ_Usuario_Username 
    ON dbo.Usuario(Username) 
    WHERE Username IS NOT NULL;
    
    PRINT 'Column Username added to Usuario table successfully.';
END
ELSE
BEGIN
    PRINT 'Column Username already exists in Usuario table.';
END
GO
