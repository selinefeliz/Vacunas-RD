-- Migration to fix the unique constraint on id_Usuario in the Nino table
-- SQL Server's UNIQUE constraint allows only one NULL value, which causes errors
-- when registering multiple children without an associated user account.
-- We replace it with a Filtered Unique Index that allows multiple NULLs.

DECLARE @ConstraintName nvarchar(200);

-- Find the unique constraint name for the id_Usuario column in the Nino table
-- We check for constraints that involve the 'id_Usuario' column
SELECT @ConstraintName = dc.name
FROM sys.key_constraints dc
JOIN sys.index_columns ic ON dc.parent_object_id = ic.object_id AND dc.unique_index_id = ic.index_id
JOIN sys.columns c ON ic.column_id = c.column_id AND ic.object_id = c.object_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.Nino')
AND dc.type = 'UQ'
AND c.name = 'id_Usuario';

-- If found, drop it
IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @DropSql nvarchar(max) = 'ALTER TABLE dbo.Nino DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
    EXEC(@DropSql);
    PRINT 'Dropped unique constraint: ' + @ConstraintName;
END
ELSE
BEGIN
    -- Fallback: check if it's just a unique index and not a constraint
    SELECT @ConstraintName = name 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('dbo.Nino') 
    AND is_unique = 1 
    AND name LIKE 'UQ__Nino__%' -- Common pattern
    AND EXISTS (
        SELECT 1 FROM sys.index_columns ic 
        JOIN sys.columns c ON ic.column_id = c.column_id AND ic.object_id = c.object_id
        WHERE ic.object_id = sys.indexes.object_id 
        AND ic.index_id = sys.indexes.index_id
        AND c.name = 'id_Usuario'
    );

    IF @ConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropIndexSql nvarchar(max) = 'DROP INDEX ' + QUOTENAME(@ConstraintName) + ' ON dbo.Nino';
        EXEC(@DropIndexSql);
        PRINT 'Dropped unique index: ' + @ConstraintName;
    END
END

-- Create a filtered unique index (best practice for optional unique fields in SQL Server)
-- This allows multiple NULL values but ensures uniqueness for non-NULL values.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UIX_Nino_id_Usuario' AND object_id = OBJECT_ID('dbo.Nino'))
BEGIN
    CREATE UNIQUE INDEX UIX_Nino_id_Usuario ON dbo.Nino(id_Usuario) WHERE id_Usuario IS NOT NULL;
    PRINT 'Created filtered unique index UIX_Nino_id_Usuario on dbo.Nino(id_Usuario).';
END
GO
