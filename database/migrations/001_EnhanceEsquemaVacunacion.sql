-- 1. Create robust EsquemaVacunacion table
IF OBJECT_ID('dbo.EsquemaVacunacion', 'U') IS NOT NULL
    DROP TABLE dbo.EsquemaVacunacion;
GO

CREATE TABLE EsquemaVacunacion (
    id_Esquema INT IDENTITY(1,1) PRIMARY KEY,
    id_Vacuna INT NOT NULL,
    NumeroDosis INT NOT NULL CHECK (NumeroDosis >= 1),
    EdadMinimaMeses INT NOT NULL DEFAULT 0,
    EdadMaximaMeses INT NULL, -- NULL = No upper limit (e.g. Tetanus)
    IntervaloMinimoDias INT NULL, -- 30 days = 1 month, 60 days = 2 months. Shortened name.
    GeneroObjetivo CHAR(1) DEFAULT 'A' CHECK (GeneroObjetivo IN ('M', 'F', 'A')), -- M=Male, F=Female, A=Ambos
    EsRefuerzo BIT DEFAULT 0,
    Descripcion NVARCHAR(200),
    CONSTRAINT FK_Esquema_Vacuna FOREIGN KEY (id_Vacuna) REFERENCES Vacuna(id_Vacuna) ON DELETE CASCADE,
    CONSTRAINT UQ_Esquema_Vacuna_Dosis UNIQUE (id_Vacuna, NumeroDosis)
);
GO

-- 2. Populate Rules based on User's Request/Images

-- Helper to safely get ID
DECLARE @idBCG INT, @idHepB INT, @idPolio INT, @idRota INT, @idNeumo INT, 
        @idPenta INT, @idSRP INT, @idDPT INT, @idDT INT, @idHPV INT, @idInfluenza INT;

SELECT TOP 1 @idBCG = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%BCG%';
SELECT TOP 1 @idHepB = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%Hepatitis B%';
SELECT TOP 1 @idPolio = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%Polio%' OR Nombre LIKE '%IPV%' OR Nombre LIKE '%OPV%';
SELECT TOP 1 @idRota = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%Rotavirus%';
SELECT TOP 1 @idPenta = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%Pentavalente%';
SELECT TOP 1 @idNeumo = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%Neumococo%' OR Nombre LIKE '%Prevenar%';
SELECT TOP 1 @idSRP = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%SRP%' OR Nombre LIKE '%Triple Viral%';
SELECT TOP 1 @idDPT = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%DPT%'; -- Difteria, Tetanos, Tos Ferina
SELECT TOP 1 @idDT = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%DT%' AND Nombre NOT LIKE '%DPT%';
SELECT TOP 1 @idHPV = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%Papiloma%' OR Nombre LIKE '%VPH%' OR Nombre LIKE '%Gardasil%';
SELECT TOP 1 @idInfluenza = id_Vacuna FROM Vacuna WHERE Nombre LIKE '%Influenza%';


-- ... BCG ...
IF @idBCG IS NOT NULL
INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
VALUES (@idBCG, 1, 0, NULL, 'A', 'Al nacer');

-- ... Hepatitis B ...
IF @idHepB IS NOT NULL
INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
VALUES (@idHepB, 1, 0, NULL, 'A', 'Al nacer');

-- ... Polio (IPV/OPV) ...
IF @idPolio IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES 
    (@idPolio, 1, 2, NULL, 'A', '2 meses'),
    (@idPolio, 2, 4, 56, 'A', '4 meses (Min 8 semanas despues de 1ra)'),
    (@idPolio, 3, 6, 56, 'A', '6 meses (Min 8 semanas despues de 2da)');

    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, EsRefuerzo, GeneroObjetivo, Descripcion)
    VALUES
    (@idPolio, 4, 18, 180, 1, 'A', 'Refuerzo 18 meses'),
    (@idPolio, 5, 48, 365, 1, 'A', 'Refuerzo 4 años');
END

-- ... Pentavalente ...
IF @idPenta IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES
    (@idPenta, 1, 2, NULL, 'A', '2 meses'),
    (@idPenta, 2, 4, 56, 'A', '4 meses'),
    (@idPenta, 3, 6, 56, 'A', '6 meses');
END

-- ... Rotavirus ...
IF @idRota IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, EdadMaximaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES
    (@idRota, 1, 2, 8, NULL, 'A', '2 meses (Max 8)'),
    (@idRota, 2, 4, 8, 56, 'A', '4 meses (Max 8)');
END

-- ... Neumococo ...
IF @idNeumo IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES
    (@idNeumo, 1, 2, NULL, 'A', '2 meses'),
    (@idNeumo, 2, 4, 56, 'A', '4 meses'),
    (@idNeumo, 3, 12, 120, 'A', '12 meses (Refuerzo)');
END

-- ... SRP ...
IF @idSRP IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES
    (@idSRP, 1, 12, NULL, 'A', '12 meses'),
    (@idSRP, 2, 48, 365, 'A', '4 años (Refuerzo)');
END

-- ... DPT ...
IF @idDPT IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES
    (@idDPT, 1, 18, NULL, 'A', '18 meses (Refuerzo)');
END

-- ... Influenza ...
IF @idInfluenza IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES
    (@idInfluenza, 1, 6, NULL, 'A', 'Dosis anual');
END

-- ... HPV ...
IF @idHPV IS NOT NULL
BEGIN
    INSERT INTO EsquemaVacunacion (id_Vacuna, NumeroDosis, EdadMinimaMeses, EdadMaximaMeses, IntervaloMinimoDias, GeneroObjetivo, Descripcion)
    VALUES
    (@idHPV, 1, 108, 168, NULL, 'F', '9-14 años (108-168 meses)'),
    (@idHPV, 2, 114, 168, 180, 'F', '6 meses despues de 1ra');
END

GO
