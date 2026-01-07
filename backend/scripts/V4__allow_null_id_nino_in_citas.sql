-- V4: Allow NULL for id_Nino in Citas table
-- This script modifies the Citas table to allow creating appointments without a specific child.

ALTER TABLE Citas
ALTER COLUMN id_Nino INT NULL;
GO

PRINT 'V4 migration complete: Citas.id_Nino now allows NULLs.';
GO
