-- Create HistoricoMedico table for patient's unique medical history
-- This is separate from HistoricoVacunas which contains multiple vaccination records

IF OBJECT_ID('dbo.HistoricoMedico', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistoricoMedico (
        id_HistoricoMedico INT IDENTITY(1,1) PRIMARY KEY,
        id_Nino INT NOT NULL UNIQUE, -- One medical history per patient
        Alergias NVARCHAR(MAX) NULL,
        NotasAdicionales NVARCHAR(MAX) NULL,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        FechaActualizacion DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_HistoricoMedico_Nino FOREIGN KEY (id_Nino) REFERENCES Nino(id_Nino) ON DELETE CASCADE
    );
    PRINT 'Created HistoricoMedico table';
END
ELSE
BEGIN
    PRINT 'HistoricoMedico table already exists';
END
GO
