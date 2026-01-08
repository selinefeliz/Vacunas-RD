-- Add Alergias and NotasAdicionales columns to Nino table for basic medical history
-- This allows storing patient medical information before any vaccination

IF COL_LENGTH('dbo.Nino','Alergias') IS NULL
BEGIN
    ALTER TABLE dbo.Nino
    ADD Alergias NVARCHAR(MAX) NULL;
    PRINT 'Added Alergias column to Nino table';
END;

IF COL_LENGTH('dbo.Nino','NotasAdicionales') IS NULL
BEGIN
    ALTER TABLE dbo.Nino
    ADD NotasAdicionales NVARCHAR(MAX) NULL;
    PRINT 'Added NotasAdicionales column to Nino table';
END;
GO
