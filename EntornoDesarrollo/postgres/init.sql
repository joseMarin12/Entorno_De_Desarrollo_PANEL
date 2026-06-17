
-- Roles y permisos

CREATE TABLE role (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(45) NOT NULL
);

INSERT INTO role (id, name) OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Administrador'),
    (2, 'Usuario')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval(
    pg_get_serial_sequence('role', 'id'),
    (SELECT COALESCE(MAX(id), 1) FROM role),
    true
);

CREATE TABLE permission (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(16) NOT NULL
);

INSERT INTO permission (name)
VALUES
    ('CREATE'),
    ('READ'),
    ('UPDATE'),
    ('DELETE');

CREATE TABLE "user" (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    surname VARCHAR(128),
    email VARCHAR(128) UNIQUE NOT NULL,
    roleid INT,
    enabled BOOLEAN DEFAULT TRUE,
    password VARCHAR(255) NOT NULL,
    first_login BOOLEAN DEFAULT true,
    CONSTRAINT fk_user_role FOREIGN KEY (roleid) REFERENCES role(id) ON DELETE SET NULL
);
--Creación de usuario primera vez (Contraseña admin)
INSERT INTO "user" (name, surname, email, roleid, enabled, password, first_login)
VALUES ('admin', 'admin', 'administrador@example.com', 1, true, '$2a$10$7UKIy//QMfkq2ec2d5znR.EaOFTjzuD/CohXMHSbNw9OfMnh5zyW.', true);


CREATE TABLE localization (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    url VARCHAR(255)
);

CREATE TABLE role_localization_permission (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    roleid INT,
    localization_id INT,
    permission_id INT,
    FOREIGN KEY (roleid) REFERENCES role(id) ON DELETE CASCADE,
    FOREIGN KEY (localization_id) REFERENCES localization(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
);


CREATE TABLE comerciales (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL,
    primer_apellido VARCHAR(45),
    segundo_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(128) UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipo_empresa (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_empresa VARCHAR(45) NOT NULL
);

INSERT INTO tipo_empresa (tipo_empresa)
VALUES 
    ('Tecnológica'),
    ('Consultoría'),
    ('Logística'),
    ('Marketing');

CREATE TABLE empresa (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_empresa VARCHAR(45) NOT NULL,
    razon_social VARCHAR(128),
    cif VARCHAR(9) UNIQUE,
    id_tipo_empresa INT,
    id_comerciales INT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tipo_empresa) REFERENCES tipo_empresa(id) ON DELETE SET NULL,
    FOREIGN KEY (id_comerciales) REFERENCES comerciales(id) ON DELETE SET NULL
);

CREATE TABLE pais (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pais VARCHAR(45) NOT NULL
);

INSERT INTO pais (pais) VALUES 
    ('Argentina'),
    ('España'),
    ('México');

CREATE TABLE provincia (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pais INT,
    provincia VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_pais) REFERENCES pais(id) ON DELETE CASCADE
);

INSERT INTO provincia (id_pais, provincia) VALUES
    (1, 'Buenos Aires'),
    (1, 'Córdoba'),
    (1, 'Mendoza'),
    (2, 'Madrid'),
    (2, 'Barcelona'),
    (2, 'A Coruña'),
    (3, 'Jalisco'),
    (3, 'Nuevo León'),
    (3, 'Yucatán');

CREATE TABLE localidad (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_provincia INT,
    localidad VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_provincia) REFERENCES provincia(id) ON DELETE CASCADE
);

INSERT INTO localidad (id_provincia, localidad) VALUES
    (1, 'La Plata'),
    (1, 'Mar del Plata'),
    (2, 'Villa Carlos Paz'),
    (2, 'Río Cuarto'),
    (3, 'Godoy Cruz'),
    (3, 'San Rafael'),
    (4, 'Alcalá de Henares'),
    (4, 'Móstoles'),
    (5, 'Hospitalet de Llobregat'),
    (5, 'Badalona'),
    (6, 'Santiago de Compostela'),
    (6, 'A Coruña'),
    (7, 'Guadalajara'),
    (7, 'Puerto Vallarta'),
    (8, 'Monterrey'),
    (8, 'San Nicolás de los Garza'),
    (9, 'Mérida'),
    (9, 'Valladolid');

CREATE TABLE direccion_empresa (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    direccion VARCHAR(128),
    codigo_postal VARCHAR(10),
    id_empresa INT,
    id_localidad INT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (id_localidad) REFERENCES localidad(id) ON DELETE CASCADE
);

CREATE TABLE contacto_empresa (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL,
    primer_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(128),
    cargo VARCHAR(45),
    id_empresa INT,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE
);

CREATE TABLE seleccionadores (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL,
    primer_apellido VARCHAR(64) NOT NULL,
    segundo_apellido VARCHAR(64),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('interno', 'externo')),
    email VARCHAR(128) UNIQUE,
    telefono VARCHAR(20),
    id_empresa INT,
    fecha_ini DATE,
    salario INT,
    fee INT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE SET NULL
);

CREATE TABLE trabajador (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL,
    primer_apellido VARCHAR(45),
    segundo_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(128) UNIQUE,
    dni_nif_pasaporte VARCHAR(20) UNIQUE,
    salario DOUBLE PRECISION,
    cheques_guarderia INT,
    cheques_restaurante INT,
    direccion VARCHAR(128),
    nacionalidad VARCHAR(45),
    fecha_nacimiento DATE,
    id_seleccionadores INT, 
    activo BOOLEAN DEFAULT TRUE,
    fecha_ini DATE,
    fecha_fin DATE,
    codigo_postal VARCHAR(10),
    id_localidad INT,
    freelance BOOLEAN DEFAULT FALSE,
    id_provincia INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_seleccionadores) REFERENCES seleccionadores(id) ON DELETE SET NULL,
    FOREIGN KEY (id_localidad) REFERENCES localidad(id) ON DELETE SET NULL,
    FOREIGN KEY (id_provincia) REFERENCES provincia(id) ON DELETE SET NULL
);

CREATE TABLE tipo_documento (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

INSERT INTO tipo_documento (nombre) VALUES
    ('Contrato Laboral'),
    ('Certificado Bancario');

CREATE TABLE documento (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_trabajador INT NOT NULL,
    id_tipo_documento INT,
    nombre_fichero VARCHAR(255),
    descripcion TEXT,
    requiere_firma BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_trabajador)     REFERENCES trabajador(id)          ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento(id)      ON DELETE SET NULL
);

CREATE TABLE documento_archivo (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento INT UNIQUE NOT NULL,
    contenido_b64 TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_documento) REFERENCES documento(id) ON DELETE CASCADE
);

CREATE TABLE firma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento INT UNIQUE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_ENVIO' CHECK (estado IN ('PENDIENTE_ENVIO', 'EN_SINATURA', 'COMPLETADO', 'RECHAZADO', 'CANCELADO')),
    sinatura_id VARCHAR(100) UNIQUE,
    requiere_firma_rrhh BOOLEAN NOT NULL DEFAULT FALSE,
    email_segundo_firmante VARCHAR(254), 
    motivo VARCHAR(255),                  
    fecha_envio            TIMESTAMP,
    fecha_firma_trabajador TIMESTAMP,
    fecha_firma_rrhh       TIMESTAMP,
    fecha_completado       TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_documento) REFERENCES documento(id) ON DELETE CASCADE
);


CREATE TABLE asignacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_empresa INT,
    id_trabajador INT,
    id_comerciales INT,
    fecha_ini DATE,
    fecha_fin DATE,
    tarifa DOUBLE PRECISION,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id),
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id),
    FOREIGN KEY (id_comerciales) REFERENCES comerciales(id)
);


CREATE TABLE estado_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

INSERT INTO estado_formacion (nombre) VALUES
    ('Activo'),
    ('Inactivo'),
    ('Planificada'),
    ('En curso'),
    ('Finalizada'),
    ('Cancelada');

CREATE TABLE area_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

INSERT INTO area_formacion (nombre) VALUES
    ('Técnica'),
    ('Habilidades blandas'),
    ('Seguridad'),
    ('Idiomas'),
    ('Gestión y liderazgo'),
    ('Otros');

CREATE TABLE modalidad_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

INSERT INTO modalidad_formacion (nombre) VALUES
    ('Presencial'),
    ('Online'),
    ('Semipresencial'),
    ('A distancia');

CREATE TABLE ejecucion_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45)
);

INSERT INTO ejecucion_formacion (nombre) VALUES
    ('Interna'),
    ('Externa'),
    ('Mixta');

CREATE TABLE formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_estado INT,
    curso VARCHAR(100),
    denominacion VARCHAR(255),
    motivo TEXT,
    id_area INT,
    recursos TEXT,
    id_responsable INT,
    id_modalidad INT,
    duracion INT,
    dentro_fuera_jornada VARCHAR(20),
    observaciones TEXT,
    fecha_prevista DATE,
    fecha_inicio DATE,
    fecha_fin DATE,
    horario VARCHAR(100),
    id_ejecucion INT,
    eficacia VARCHAR(45),
    anio INT,
    coste DOUBLE PRECISION,
    bonificacion DOUBLE PRECISION,
    total DOUBLE PRECISION,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estado) REFERENCES estado_formacion(id) ON DELETE SET NULL,
    FOREIGN KEY (id_area) REFERENCES area_formacion(id) ON DELETE SET NULL,
    FOREIGN KEY (id_responsable) REFERENCES "user"(id) ON DELETE SET NULL,
    FOREIGN KEY (id_modalidad) REFERENCES modalidad_formacion(id) ON DELETE SET NULL,
    FOREIGN KEY (id_ejecucion) REFERENCES ejecucion_formacion(id) ON DELETE SET NULL
);



CREATE TABLE formacion_trabajador (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_formacion INT,
    id_trabajador INT,
    asistencia BOOLEAN DEFAULT FALSE,
    eficacia VARCHAR(45),
    FOREIGN KEY (id_formacion) REFERENCES formacion(id) ON DELETE CASCADE,
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id) ON DELETE CASCADE
);


CREATE INDEX idx_trabajador_seleccionadores ON trabajador(id_seleccionadores);
CREATE INDEX idx_trabajador_localidad ON trabajador(id_localidad);
CREATE INDEX idx_asignacion_empresa ON asignacion(id_empresa);
CREATE INDEX idx_asignacion_trabajador ON asignacion(id_trabajador);
CREATE INDEX idx_empresa_tipo ON empresa(id_tipo_empresa);
CREATE INDEX idx_documento_trabajador ON documento(id_trabajador);
CREATE INDEX idx_documento_tipo ON documento(id_tipo_documento);
CREATE INDEX idx_firma_estado ON firma(estado);


INSERT INTO tipo_empresa (tipo_empresa)
VALUES
    ('Tecnológica'),
    ('Consultoría'),
    ('Logística'),
    ('Marketing');