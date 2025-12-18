-- Refactor EsquemaVacunacion to support specific ages per dose
PRINT 'Refactorizando EsquemaVacunacion para soportar edades especificas por dosis...';

DROP TABLE IF EXISTS EsquemaVacunacion;
GO

CREATE TABLE EsquemaVacunacion (
    id_EsquemaVacuna INT PRIMARY KEY IDENTITY(1,1),
    id_Vacuna INT NOT NULL,
    DosisNumero INT NOT NULL,
    EdadMesesRecomendada INT NOT NULL,
    EsRefuerzo BIT DEFAULT 0,
    FOREIGN KEY (id_Vacuna) REFERENCES Vacuna(id_Vacuna) ON DELETE CASCADE
);
GO

-- Poblado segun el Esquema Dominicano PAI 2014
DECLARE @id_BCG INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'BCG');
DECLARE @id_HepB INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'Hepatitis B');
DECLARE @id_Rota INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'Rotavirus');
DECLARE @id_Polio INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'Polio');
DECLARE @id_Penta INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'Pentavalente');
DECLARE @id_Neumo INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'Neumococo');
DECLARE @id_SRP INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'SRP');
DECLARE @id_DPT INT = (SELECT id_Vacuna FROM Vacuna WHERE Nombre = 'DPT');

-- BCG
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_BCG, 1, 0, 0);
-- Hep B
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_HepB, 1, 0, 0);
-- Rotavirus
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Rota, 1, 2, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Rota, 2, 4, 0);
-- Polio
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Polio, 1, 2, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Polio, 2, 4, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Polio, 3, 6, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Polio, 4, 18, 1);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Polio, 5, 48, 1);
-- Pentavalente
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Penta, 1, 2, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Penta, 2, 4, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Penta, 3, 6, 0);
-- Neumococo
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Neumo, 1, 2, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Neumo, 2, 4, 0);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_Neumo, 3, 12, 1);
-- SRP
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_SRP, 1, 12, 0);
-- DPT
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_DPT, 1, 18, 1);
INSERT INTO EsquemaVacunacion (id_Vacuna, DosisNumero, EdadMesesRecomendada, EsRefuerzo) VALUES (@id_DPT, 2, 48, 1);

PRINT 'Tabla EsquemaVacunacion refactorizada y poblada exitosamente.';
GO
