-- SQL Server Schema for Vaccination System - ASCII Identifiers - Idempotent

-- Drop tables in reverse order of creation due to dependencies, or handle dependencies in each drop
-- For simplicity here, we'll drop and recreate, assuming sqlcmd handles batch execution correctly with GO.

PRINT 'Dropping existing tables if they exist...';
GO

DROP TABLE IF EXISTS HistoricoCita;
GO
DROP TABLE IF EXISTS HistoricoVacunas;
GO
DROP TABLE IF EXISTS CitaVacunacion;
GO
DROP TABLE IF EXISTS Lote;
GO
DROP TABLE IF EXISTS Vacuna;
GO
DROP TABLE IF EXISTS Fabricante;
GO
DROP TABLE IF EXISTS TutorNino;
GO
DROP TABLE IF EXISTS Nino;
GO
DROP TABLE IF EXISTS CentroVacunacion;
GO
DROP TABLE IF EXISTS Tutor;
GO
DROP TABLE IF EXISTS Usuario;
GO
DROP TABLE IF EXISTS EstadoCita;
GO
DROP TABLE IF EXISTS EstadoUsuario;
GO
DROP TABLE IF EXISTS Rol;
GO

PRINT 'Creating tables...';
GO

-- Table: Rol
CREATE TABLE Rol (
    id_Rol INT IDENTITY(1,1) PRIMARY KEY,
    Rol NVARCHAR(50) NOT NULL UNIQUE
);
GO

-- Table: EstadoUsuario
CREATE TABLE EstadoUsuario (
    id_Estado INT IDENTITY(1,1) PRIMARY KEY,
    Estado NVARCHAR(50) NOT NULL UNIQUE
);
GO

-- Table: EstadoCita
CREATE TABLE EstadoCita (
    id_Estado INT IDENTITY(1,1) PRIMARY KEY,
    Estado NVARCHAR(50) NOT NULL UNIQUE -- e.g. 'Agendada', 'Asistida', 'Cancelada'
);
GO

-- Table: Usuario
CREATE TABLE Usuario (
    id_Usuario INT IDENTITY(1,1) PRIMARY KEY,
    id_Rol INT NOT NULL,
    id_Estado INT NOT NULL,
    Cedula_Usuario NVARCHAR(15) UNIQUE,
    Email NVARCHAR(100) UNIQUE,
    Clave NVARCHAR(255) NOT NULL, -- Store hashed passwords
    id_CentroVacunacion INT NULL,
    CONSTRAINT FK_Usuario_Rol FOREIGN KEY (id_Rol) REFERENCES Rol(id_Rol),
    CONSTRAINT FK_Usuario_EstadoUsuario FOREIGN KEY (id_Estado) REFERENCES EstadoUsuario(id_Estado),
    CONSTRAINT FK_Usuario_CentroVacunacion FOREIGN KEY (id_CentroVacunacion) REFERENCES CentroVacunacion(id_CentroVacunacion) ON DELETE SET NULL
);
GO
IF COL_LENGTH('dbo.Usuario','Nombre') IS NULL
BEGIN
    ALTER TABLE dbo.Usuario
    ADD Nombre NVARCHAR(100) NULL;
END;

IF COL_LENGTH('dbo.Usuario','Apellido') IS NULL
BEGIN
    ALTER TABLE dbo.Usuario
    ADD Apellido NVARCHAR(100) NULL;
END;

-- Table: Tutor
CREATE TABLE Tutor (
    id_Tutor INT IDENTITY(1,1) PRIMARY KEY,
    id_Usuario INT UNIQUE,
    Cedula_Tutor NVARCHAR(15) UNIQUE NOT NULL,
    Nombres NVARCHAR(100) NOT NULL,
    Apellidos NVARCHAR(100) NOT NULL,
    Telefono NVARCHAR(20),
    Email NVARCHAR(100),
    Direccion NVARCHAR(200),
    CONSTRAINT FK_Tutor_Usuario FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario) ON DELETE SET NULL
);
GO

-- Table: CentroVacunacion
CREATE TABLE CentroVacunacion (
    id_CentroVacunacion INT IDENTITY(1,1) PRIMARY KEY,
    NombreCentro NVARCHAR(100) NOT NULL,
    NombreCorto NVARCHAR(50),
    Direccion NVARCHAR(200) NOT NULL,
    Telefono NVARCHAR(20),
    Director NVARCHAR(100),
    Web NVARCHAR(100)
);
GO
-- Created by GitHub Copilot in SSMS - review carefully before executing

/* Add missing columns referenced by usp_CreateVaccinationCenter.
   Columns are added as NULL to avoid breaking existing data/logic.
   FK constraints are NOT created because referenced objects (Estado/Provincia/Municipio)
   do not exist in dbo. If they exist in another schema/database, add FKs manually. */

IF COL_LENGTH('dbo.CentroVacunacion','Capacidad') IS NULL
BEGIN
    EXEC sp_executesql N'ALTER TABLE dbo.CentroVacunacion ADD Capacidad INT NULL;';
END;

IF NOT EXISTS(
    SELECT 1 FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID('dbo.CentroVacunacion')
      AND cc.name = 'CK_CentroVacunacion_Capacidad'
)
AND EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CentroVacunacion') AND name = 'Capacidad')
BEGIN
    EXEC sp_executesql N'ALTER TABLE dbo.CentroVacunacion ADD CONSTRAINT CK_CentroVacunacion_Capacidad CHECK (Capacidad >= 0);';
END;

IF COL_LENGTH('dbo.CentroVacunacion','id_Estado') IS NULL
BEGIN
    EXEC sp_executesql N'ALTER TABLE dbo.CentroVacunacion ADD id_Estado INT NULL;';
END;

IF COL_LENGTH('dbo.CentroVacunacion','id_Provincia') IS NULL
BEGIN
    EXEC sp_executesql N'ALTER TABLE dbo.CentroVacunacion ADD id_Provincia INT NULL;';
END;

IF COL_LENGTH('dbo.CentroVacunacion','id_Municipio') IS NULL
BEGIN
    EXEC sp_executesql N'ALTER TABLE dbo.CentroVacunacion ADD id_Municipio INT NULL;';
END;

-- Table: Nino (Child) - Changed from Niño
CREATE TABLE Nino (
    id_Nino INT IDENTITY(1,1) PRIMARY KEY, -- Changed from id_Niño
    id_Usuario INT UNIQUE,
    Nombres NVARCHAR(100) NOT NULL,
    Apellidos NVARCHAR(100) NOT NULL,
    FechaNacimiento DATE NOT NULL,
    Genero CHAR(1) CHECK (Genero IN ('M', 'F', 'O')), -- M: Male, F: Female, O: Other
    Email NVARCHAR(100),
    DireccionResidencia NVARCHAR(200),
    CodigoIdentificacionPropio NVARCHAR(20) UNIQUE,
    PaisNacimiento NVARCHAR(100),
    id_CentroSaludAsignado INT,
    CONSTRAINT FK_Nino_Usuario FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario) ON DELETE SET NULL,
    CONSTRAINT FK_Nino_CentroSaludAsignado FOREIGN KEY (id_CentroSaludAsignado) REFERENCES CentroVacunacion(id_CentroVacunacion) ON DELETE SET NULL
);
GO

-- Table: TutorNino (Tutor-Child Relationship) - Changed from TutorNiño
CREATE TABLE TutorNino (
    id_Tutor INT NOT NULL,
    id_Nino INT NOT NULL, -- Changed from id_Niño
    CONSTRAINT PK_TutorNino PRIMARY KEY (id_Tutor, id_Nino), -- Changed from id_Niño
    CONSTRAINT FK_TutorNino_Tutor FOREIGN KEY (id_Tutor) REFERENCES Tutor(id_Tutor) ON DELETE CASCADE,
    CONSTRAINT FK_TutorNino_Nino FOREIGN KEY (id_Nino) REFERENCES Nino(id_Nino) ON DELETE CASCADE -- Changed from id_Niño and Niño
);
GO

-- Table: Fabricante (Manufacturer)
CREATE TABLE Fabricante (
    id_Fabricante INT IDENTITY(1,1) PRIMARY KEY,
    Fabricante NVARCHAR(100) NOT NULL UNIQUE
);
GO

-- Table: Vacuna (Vaccine Catalog)
CREATE TABLE Vacuna (
    id_Vacuna INT IDENTITY(1,1) PRIMARY KEY,
    id_Fabricante INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    DosisLimite INT,
    Tipo NVARCHAR(50),
    Descripcion NVARCHAR(MAX),
    CONSTRAINT FK_Vacuna_Fabricante FOREIGN KEY (id_Fabricante) REFERENCES Fabricante(id_Fabricante)
);
GO

-- Table: Lote (Vaccine Lot)
CREATE TABLE Lote (
    id_LoteVacuna INT IDENTITY(1,1) PRIMARY KEY,
    id_VacunaCatalogo INT NOT NULL,
    id_CentroVacunacion INT NOT NULL, -- Added
    NumeroLote NVARCHAR(50) NOT NULL,
    FechaCaducidad DATE NOT NULL,
    CantidadInicial INT NOT NULL CHECK (CantidadInicial >= 0),
    CantidadDisponible INT NOT NULL CHECK (CantidadDisponible >= 0),
    CONSTRAINT UQ_Lote_Centro_Vacuna_NumeroLote UNIQUE (id_CentroVacunacion, id_VacunaCatalogo, NumeroLote), -- Updated unique constraint
    CONSTRAINT FK_Lote_Vacuna FOREIGN KEY (id_VacunaCatalogo) REFERENCES Vacuna(id_Vacuna),
    CONSTRAINT FK_Lote_CentroVacunacion FOREIGN KEY (id_CentroVacunacion) REFERENCES CentroVacunacion(id_CentroVacunacion), -- Added FK
    CONSTRAINT CK_Lote_CantidadDisponible CHECK (CantidadDisponible <= CantidadInicial)
);
GO

-- Table: CitaVacunacion (Vaccination Appointment)
CREATE TABLE CitaVacunacion (
    id_Cita INT IDENTITY(1,1) PRIMARY KEY,
    id_Nino INT NOT NULL, -- Changed from id_Niño
    id_Vacuna INT NOT NULL,
    id_PersonalSalud INT, -- Health personnel user ID
    id_UsuarioRegistraCita INT NOT NULL, -- User ID who registered the appointment
    id_CentroVacunacion INT NOT NULL,
    Fecha DATE NOT NULL,
    Hora TIME,
    id_EstadoCita INT NOT NULL,
    RequiereTutor BIT DEFAULT 0, -- 0 for False, 1 for True
    NombreCompletoPersonalAplicado NVARCHAR(100),
    id_LoteAplicado INT,
    CONSTRAINT FK_CitaVacunacion_Nino FOREIGN KEY (id_Nino) REFERENCES Nino(id_Nino) ON DELETE CASCADE, -- Changed from id_Niño and Niño
    CONSTRAINT FK_CitaVacunacion_Vacuna FOREIGN KEY (id_Vacuna) REFERENCES Vacuna(id_Vacuna),
    CONSTRAINT FK_CitaVacunacion_PersonalSalud FOREIGN KEY (id_PersonalSalud) REFERENCES Usuario(id_Usuario) ON DELETE SET NULL,
    CONSTRAINT FK_CitaVacunacion_UsuarioRegistraCita FOREIGN KEY (id_UsuarioRegistraCita) REFERENCES Usuario(id_Usuario),
    CONSTRAINT FK_CitaVacunacion_CentroVacunacion FOREIGN KEY (id_CentroVacunacion) REFERENCES CentroVacunacion(id_CentroVacunacion),
    CONSTRAINT FK_CitaVacunacion_EstadoCita FOREIGN KEY (id_EstadoCita) REFERENCES EstadoCita(id_Estado),
    CONSTRAINT FK_CitaVacunacion_Lote FOREIGN KEY (id_LoteAplicado) REFERENCES Lote(id_LoteVacuna) ON DELETE SET NULL
);
GO
-- Created by GitHub Copilot in SSMS - review carefully before executing
IF COL_LENGTH('dbo.CitaVacunacion','FechaCreacion') IS NULL
BEGIN
    ALTER TABLE dbo.CitaVacunacion
    ADD FechaCreacion DATETIME2 NULL;
END;

-- Table: HistoricoVacunas (Vaccination History)
CREATE TABLE HistoricoVacunas (
    id_Historico INT IDENTITY(1,1) PRIMARY KEY,
    id_Nino INT NOT NULL, -- Changed from id_Niño
    id_Cita INT UNIQUE,
    FechaAplicacion DATE NOT NULL,
    DosisAplicada NVARCHAR(50) NOT NULL,
    EdadAlMomento NVARCHAR(20),
    VacunaNombre NVARCHAR(100) NOT NULL,
    FabricanteNombre NVARCHAR(100),
    LoteNumero NVARCHAR(50),
    PersonalSaludNombre NVARCHAR(100),
    FirmaDigital VARBINARY(MAX),
    EdadRegistroMeses INT,
    NotasAdicionales NVARCHAR(MAX),
    Alergias NVARCHAR(MAX),
    CONSTRAINT FK_HistoricoVacunas_Nino FOREIGN KEY (id_Nino) REFERENCES Nino(id_Nino) ON DELETE CASCADE, -- Changed from id_Niño and Niño
    CONSTRAINT FK_HistoricoVacunas_Cita FOREIGN KEY (id_Cita) REFERENCES CitaVacunacion(id_Cita) ON DELETE NO ACTION -- Changed from ON DELETE SET NULL
);
GO

-- Table: HistoricoCita (Appointment History Log)
CREATE TABLE HistoricoCita (
    id_Historico INT NOT NULL,
    id_Cita INT NOT NULL,
    Vacuna NVARCHAR(100),
    NombreCompletoPersonal NVARCHAR(100),
    CentroMedico NVARCHAR(100),
    Fecha DATE,
    Hora TIME,
    Notas NVARCHAR(MAX),
    CONSTRAINT PK_HistoricoCita PRIMARY KEY (id_Historico, id_Cita),
    CONSTRAINT FK_HistoricoCita_HistoricoVacunas FOREIGN KEY (id_Historico) REFERENCES HistoricoVacunas(id_Historico),
    CONSTRAINT FK_HistoricoCita_CitaVacunacion FOREIGN KEY (id_Cita) REFERENCES CitaVacunacion(id_Cita)
);
GO

-- Table: DisponibilidadHoraria (Availability)
CREATE TABLE DisponibilidadHoraria (
    id_Disponibilidad INT IDENTITY(1,1) PRIMARY KEY,
    id_CentroVacunacion INT NOT NULL,
    Fecha DATE NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    CuposTotales INT NOT NULL CHECK (CuposTotales >= 0),
    CuposDisponibles INT NOT NULL CHECK (CuposDisponibles >= 0 AND CuposDisponibles <= CuposTotales),
    CONSTRAINT FK_DisponibilidadHoraria_CentroVacunacion FOREIGN KEY (id_CentroVacunacion) REFERENCES CentroVacunacion(id_CentroVacunacion) ON DELETE CASCADE,
    CONSTRAINT UQ_DisponibilidadHoraria_Slot UNIQUE (id_CentroVacunacion, Fecha, HoraInicio, HoraFin) -- Ensures a slot is unique
);
GO

-- Table: EsquemaVacunacion (Childhood Vaccination Schedule)
CREATE TABLE EsquemaVacunacion (
    id_EsquemaVacuna INT PRIMARY KEY IDENTITY(1,1),
    id_Vacuna INT NOT NULL,                      -- FK to Vacuna table
    EdadRecomendadaMeses INT NOT NULL,           -- Recommended age for the first dose in months (e.g., 2 months)
    IntervaloMesesSiguienteDosis INT NULL,       -- Time until the next dose, if applicable
    NumeroDosis INT NOT NULL,                    -- Total number of doses required in the schedule
    EsRefuerzo BIT DEFAULT 0,                    -- If this dose is a booster (optional)
    FOREIGN KEY (id_Vacuna) REFERENCES Vacuna(id_Vacuna) ON DELETE CASCADE
);
GO

PRINT 'Inserting initial data...';
GO

-- Initial Data (Examples)
INSERT INTO Rol (Rol) VALUES
    ('Administrador'),
    ('Medico'),
    ('Enfermera'),
    ('Digitador'),
    ('Tutor'),
    ('Personal del Centro de Vacunación');
GO

INSERT INTO EstadoUsuario (Estado) VALUES
    ('Activo'),
    ('Inactivo'),
    ('Bloqueado'),
    ('Pendiente Verificacion');
GO

INSERT INTO EstadoCita (Estado) VALUES
    ('Agendada'),
    ('Confirmada'),
    ('Asistida'),
    ('Cancelada por Paciente'),
    ('Cancelada por Centro'),
    ('No Asistio'),
    ('Reprogramada');
GO

PRINT 'Database schema created successfully with initial data.';
GO
