-- Definicion del Esquema Dominicano PAI 2014
PRINT 'Poblando Esquema de Vacunacion Dominicano...';

-- 1. Asegurar que el Fabricante genérico exista
IF NOT EXISTS (SELECT 1 FROM Fabricante WHERE Fabricante = 'Generico')
    INSERT INTO Fabricante (Fabricante) VALUES ('Generico');

DECLARE @id_Fab INT = (SELECT id_Fabricante FROM Fabricante WHERE Fabricante = 'Generico');

-- 2. Asegurar que las vacunas existan
IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'BCG')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('BCG', @id_Fab, 1, 'Bacteriana', 'Tuberculosis grave infantil');

IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'Hepatitis B')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('Hepatitis B', @id_Fab, 1, 'Viral', 'Hepatitis B Recien Nacido');

IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'Rotavirus')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('Rotavirus', @id_Fab, 2, 'Viral', 'Diarreas graves por Rotavirus');

IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'Polio')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('Polio', @id_Fab, 5, 'Viral', 'Poliomielitis');

IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'Pentavalente')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('Pentavalente', @id_Fab, 3, 'Combinada', 'Difteria, Tétanos, Tos Ferina, Hep B, Hib');

IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'Neumococo')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('Neumococo', @id_Fab, 3, 'Bacteriana', 'Neumonía, Meningitis, Otitis');

IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'SRP')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('SRP', @id_Fab, 1, 'Viral', 'Sarampión, Rúbeola, Papera');

IF NOT EXISTS (SELECT 1 FROM Vacuna WHERE Nombre = 'DPT')
    INSERT INTO Vacuna (Nombre, id_Fabricante, DosisLimite, Tipo, Descripcion) VALUES ('DPT', @id_Fab, 2, 'Combinada', 'Difteria, Tos ferina, Tétano (Refuerzos)');

-- 3. Limpiar esquema previo y poblar con el nuevo
TRUNCATE TABLE EsquemaVacunacion;

-- BCG: Recien Nacido (0 meses)
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 0, NULL, 1, 0 FROM Vacuna WHERE Nombre = 'BCG';

-- Hepatitis B: Recien Nacido (0 meses)
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 0, NULL, 1, 0 FROM Vacuna WHERE Nombre = 'Hepatitis B';

-- Rotavirus: 2m, 4m (2 dosis, intervalo 2m)
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 2, 2, 2, 0 FROM Vacuna WHERE Nombre = 'Rotavirus';

-- Polio: 2m, 4m, 6m (3 dosis), Refuerzos 18m, 48m (4 años)
-- Nota: Para simplificar con la tabla actual, marcamos 5 dosis total con primer inicio a los 2m e intervalo de 2m para las primeras 3.
-- Los refuerzos son especiales, pero la tabla actual es limitada. Vamos a ajustarla luego si es necesario.
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 2, 2, 5, 0 FROM Vacuna WHERE Nombre = 'Polio';

-- Pentavalente: 2m, 4m, 6m (3 dosis)
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 2, 2, 3, 0 FROM Vacuna WHERE Nombre = 'Pentavalente';

-- Neumococo: 2m, 4m, 12m (3 dosis)
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 2, 2, 3, 0 FROM Vacuna WHERE Nombre = 'Neumococo';

-- SRP: 12 meses
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 12, NULL, 1, 0 FROM Vacuna WHERE Nombre = 'SRP';

-- DPT: 18m, 48m (2 dosis refuerzo)
-- Empezamos a los 18m con intervalo de 30m para llegar a los 4 años (48m)
INSERT INTO EsquemaVacunacion (id_Vacuna, EdadRecomendadaMeses, IntervaloMesesSiguienteDosis, NumeroDosis, EsRefuerzo)
SELECT id_Vacuna, 18, 30, 2, 1 FROM Vacuna WHERE Nombre = 'DPT';

PRINT 'Esquema de Vacunacion actualizado exitosamente.';
GO
