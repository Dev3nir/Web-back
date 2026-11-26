-- =====================================================================
--  E-Waste 360° · Tablas de gestores y movimientos
--  Base de datos: residuos_electronicos (MariaDB)
--  Requiere que ya existan las tablas `usuarios` y `equipos`.
--  Si alguna ya existía con otras columnas, revisa antes de correr esto.
-- =====================================================================

USE residuos_electronicos;

-- ---------------------------------------------------------------------
-- GESTORES: empresas / centros que reciben los residuos electrónicos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gestores (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(150) NOT NULL,
  tipo                  ENUM('reciclador','reacondicionador','centro_acopio','donataria','otro')
                        NOT NULL DEFAULT 'otro',
  contacto              VARCHAR(150) NULL,
  telefono              VARCHAR(20)  NULL,
  correo                VARCHAR(150) NULL,
  direccion             VARCHAR(255) NULL,
  materiales_aceptados  VARCHAR(255) NULL,
  numero_autorizacion   VARCHAR(100) NULL,          -- p. ej. autorización SEMARNAT
  verificado            TINYINT(1)   NOT NULL DEFAULT 0, -- solo 1 si se revisó la autorización
  activo                TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_gestores_nombre UNIQUE (nombre),
  CONSTRAINT chk_gestor_verificado CHECK (verificado = 0 OR numero_autorizacion IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- MOVIMIENTOS: historial / trazabilidad de cada equipo
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_equipo       INT NOT NULL,
  tipo            ENUM('ingreso','reasignacion','envio_reparacion','retorno_reparacion',
                       'almacenamiento','entrega_gestor','baja') NOT NULL,
  fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_responsable  INT NOT NULL,                     -- quién registró (sale del token)
  destino         VARCHAR(255) NULL,                -- laboratorio, depto, taller, ubicación...
  id_gestor       INT NULL,                         -- solo para entrega_gestor
  cantidad_kg     DECIMAL(10,2) NULL,
  evidencia       VARCHAR(255) NULL,                -- folio, manifiesto, constancia
  observaciones   TEXT NULL,
  validado        TINYINT(1) NOT NULL DEFAULT 0,    -- lo valida responsable/admin
  validado_por    INT NULL,
  validado_en     DATETIME NULL,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_mov_equipo      FOREIGN KEY (id_equipo)      REFERENCES equipos(id)  ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_mov_responsable FOREIGN KEY (id_responsable) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_mov_validador   FOREIGN KEY (validado_por)   REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_mov_gestor      FOREIGN KEY (id_gestor)      REFERENCES gestores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_mov_kg         CHECK (cantidad_kg IS NULL OR cantidad_kg > 0),
  CONSTRAINT chk_mov_gestor     CHECK (tipo <> 'entrega_gestor' OR id_gestor IS NOT NULL),

  INDEX idx_mov_equipo (id_equipo),
  INDEX idx_mov_tipo   (tipo),
  INDEX idx_mov_fecha  (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Datos de ejemplo (opcionales). Cambia los ids de equipo/usuario si no existen.
-- ---------------------------------------------------------------------
INSERT INTO gestores (nombre, tipo, contacto, telefono, correo, materiales_aceptados, numero_autorizacion, verificado) VALUES
  ('Recicla Electrónicos del Norte', 'reciclador',       'Ing. Laura Méndez', '8111234567', 'contacto@reciclanorte.mx', 'Computadoras, monitores, cables', 'SEMARNAT-19-AUT-0001', 1),
  ('ReTech Reacondicionados',        'reacondicionador', 'Carlos Ruiz',       '8119876543', 'ventas@retech.mx',         'Laptops, celulares',              NULL,                   0),
  ('Centro de Acopio Municipal',     'centro_acopio',    'Ventanilla única',  '8110001122', NULL,                       'Baterías, pilas, cargadores',     'MUN-ACOPIO-2026-07',   1);

-- Ejemplos de movimientos (requieren equipos con id 1 y 2, y el usuario admin con id 1)
-- INSERT INTO movimientos (id_equipo, tipo, id_responsable, destino) VALUES (1, 'ingreso', 1, NULL);
-- INSERT INTO movimientos (id_equipo, tipo, id_responsable, destino) VALUES (1, 'reasignacion', 1, 'Laboratorio de redes');
-- INSERT INTO movimientos (id_equipo, tipo, id_responsable, id_gestor, cantidad_kg, evidencia) VALUES (2, 'entrega_gestor', 1, 1, 8.5, 'MAN-2026-001');
