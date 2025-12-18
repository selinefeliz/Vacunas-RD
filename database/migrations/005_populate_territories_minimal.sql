-- Migration 005: Populate Territories (Minimal/Initial)
PRINT 'Executing Migration 005: Populating Territories...';
GO

-- 1. Populate Provinces (Top provinces for initial testing)
-- Official Codes from ONE (Dominican Republic)
IF NOT EXISTS (SELECT 1 FROM dbo.Provincia WHERE CodigoONE = '01')
BEGIN
    INSERT INTO dbo.Provincia (CodigoONE, Nombre) VALUES 
    ('01', 'Distrito Nacional'),
    ('02', 'Azua'),
    ('03', 'Baoruco'),
    ('04', 'Barahona'),
    ('05', 'Dajabón'),
    ('06', 'Duarte'),
    ('07', 'Elías Piña'),
    ('08', 'El Seibo'),
    ('09', 'Espaillat'),
    ('10', 'Independencia'),
    ('11', 'La Altagracia'),
    ('12', 'La Romana'),
    ('13', 'La Vega'),
    ('14', 'María Trinidad Sánchez'),
    ('15', 'Monte Cristi'),
    ('16', 'Pedernales'),
    ('17', 'Peravia'),
    ('18', 'Puerto Plata'),
    ('19', 'Hermanas Mirabal'),
    ('20', 'Samaná'),
    ('21', 'San Cristóbal'),
    ('22', 'San Juan'),
    ('23', 'San Pedro de Macorís'),
    ('24', 'Sánchez Ramírez'),
    ('25', 'Santiago'),
    ('26', 'Santiago Rodríguez'),
    ('27', 'Valverde'),
    ('28', 'Monseñor Nouel'),
    ('29', 'Monte Plata'),
    ('30', 'Hato Mayor'),
    ('31', 'San José de Ocoa'),
    ('32', 'Santo Domingo');
    PRINT 'Provinces populated.';
END
GO

-- 2. Populate some Municipalities for 'Distrito Nacional' (Province 01)
DECLARE @dn_id INT;
SELECT @dn_id = id_Provincia FROM Provincia WHERE CodigoONE = '01';

IF @dn_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @dn_id AND CodigoONE = '01')
BEGIN
    INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES 
    (@dn_id, '01', 'Santo Domingo de Guzmán');
    PRINT 'Municipalities for Distrito Nacional populated.';
END
GO

-- Populate some for 'Santo Domingo' (Province 32)
DECLARE @sd_id INT;
SELECT @sd_id = id_Provincia FROM Provincia WHERE CodigoONE = '32';

IF @sd_id IS NOT NULL 
BEGIN
    -- Insert individually checking for existence to be safe
    IF NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @sd_id AND CodigoONE = '01')
        INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES (@sd_id, '01', 'Santo Domingo Este');
    
    IF NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @sd_id AND CodigoONE = '02')
        INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES (@sd_id, '02', 'Santo Domingo Oeste');
        
    IF NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @sd_id AND CodigoONE = '03')
        INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES (@sd_id, '03', 'Santo Domingo Norte');

    IF NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @sd_id AND CodigoONE = '04')
        INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES (@sd_id, '04', 'Boca Chica');

    IF NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @sd_id AND CodigoONE = '05')
        INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES (@sd_id, '05', 'San Antonio de Guerra');

    IF NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @sd_id AND CodigoONE = '06')
        INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES (@sd_id, '06', 'Los Alcarrizos');

    IF NOT EXISTS (SELECT 1 FROM dbo.Municipio WHERE id_Provincia = @sd_id AND CodigoONE = '07')
        INSERT INTO dbo.Municipio (id_Provincia, CodigoONE, Nombre) VALUES (@sd_id, '07', 'Pedro Brand');

    PRINT 'Municipalities for Santo Domingo province populated (where missing).';
END
GO

PRINT 'Migration 005 completed successfully.';
GO
