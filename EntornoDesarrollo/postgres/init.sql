
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

-- Localizaciones

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


-- Comerciales y empresas

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

INSERT INTO comerciales (
    nombre,
    primer_apellido,
    segundo_apellido,
    telefono,
    email
)
VALUES
    ('Carlos', 'García', 'López', '600111222', 'carlos.garcia@example.com'),
    ('Lucía', 'Martín', 'Pérez', '600333444', 'lucia.martin@example.com');

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

INSERT INTO empresa (
    nombre_empresa,
    razon_social,
    cif,
    id_tipo_empresa,
    id_comerciales
)
VALUES
    ('Tech Solutions', 'Tech Solutions SL', 'B12345678', 1, 1),
    ('LogiTrans', 'LogiTrans SA', 'A87654321', 3, 2);

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

INSERT INTO direccion_empresa (
    direccion,
    codigo_postal,
    id_empresa,
    id_localidad
)
VALUES
    ('Calle Mayor 10', '28001', 1, 7),
    ('Avenida Diagonal 200', '08018', 2, 9);

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

INSERT INTO contacto_empresa (
    nombre,
    primer_apellido,
    telefono,
    email,
    cargo,
    id_empresa
)
VALUES
    ('Ana', 'Ruiz', '611222333', 'ana.ruiz@techsolutions.com', 'RRHH', 1),
    ('Pedro', 'Santos', '622333444', 'pedro.santos@logitrans.com', 'Manager', 2);

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

INSERT INTO seleccionadores (
    nombre,
    primer_apellido,
    segundo_apellido,
    tipo,
    email,
    telefono,
    id_empresa,
    fecha_ini,
    salario,
    fee
)
VALUES
    ('María', 'Fernández', 'López', 'interno', 'maria.fernandez@example.com', '633444555', 1, '2024-01-15', 32000, NULL),
    ('Javier', 'Moreno', 'Sánchez', 'externo', 'javier.moreno@example.com', '644555666', 2, '2024-02-01', NULL, 1500);

CREATE TABLE trabajador (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL,
    primer_apellido VARCHAR(45),
    segundo_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(64) UNIQUE,
    dni_nif_pasaporte VARCHAR(10) UNIQUE,
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
    codigo_postal VARCHAR(5),
    id_localidad INT,
    freelance BOOLEAN DEFAULT FALSE,
    id_provincia INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_seleccionadores) REFERENCES seleccionadores(id) ON DELETE SET NULL,
    FOREIGN KEY (id_localidad) REFERENCES localidad(id) ON DELETE SET NULL,
    FOREIGN KEY (id_provincia) REFERENCES provincia(id) ON DELETE SET NULL
);

INSERT INTO trabajador (
    nombre,
    primer_apellido,
    segundo_apellido,
    telefono,
    email,
    dni_nif_pasaporte,
    salario,
    cheques_guarderia,
    cheques_restaurante,
    direccion,
    nacionalidad,
    fecha_nacimiento,
    id_seleccionadores,
    fecha_ini,
    codigo_postal,
    id_localidad,
    freelance,
    id_provincia
)
VALUES
    ('David', 'Navarro', 'Gil', '655111222', 'david.navarro@example.com', '12345678A', 28000, 100, 150, 'Calle Luna 5', 'Española', '1995-04-20', 1, '2024-03-01', '28001', 7, FALSE, 4),
    ('Elena', 'Torres', 'Ruiz', '666222333', 'elena.torres@example.com', '87654321B', 35000, 0, 200, 'Avenida Sol 8', 'Española', '1990-08-12', 2, '2024-03-10', '08018', 9, TRUE, 5);

-- Documentacion

CREATE TABLE tipoDoc (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL
);

INSERT INTO tipoDoc (tipo) VALUES 
    ('Identificación (DNI/Pasaporte)'),
    ('Certificado Bancario'),
    ('Certificado Médico'),
    ('Contrato Laboral'),
    ('Acuerdo de Confidencialidad (NDA)'),
    ('Curriculum Vitae (CV)'),
    ('Títulos o Diplomas'),
    ('Otros Documentos');

CREATE TABLE documentacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_trabajador INT,
    id_tipoDoc INT,
    nombre_fichero VARCHAR(255),
    doc BYTEA,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tipoDoc) REFERENCES tipoDoc(id) ON DELETE CASCADE
);

-- Asignaciones

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


INSERT INTO asignacion (
    id_empresa,
    id_trabajador,
    id_comerciales,
    fecha_ini,
    fecha_fin,
    tarifa
)
VALUES
    (1, 1, 1, '2024-04-01', '2024-12-31', 350.50),
    (2, 2, 2, '2024-05-01', NULL, 420.00);
-- Formación

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

INSERT INTO formacion (
    id_estado,
    curso,
    denominacion,
    motivo,
    id_area,
    recursos,
    id_responsable,
    id_modalidad,
    duracion,
    dentro_fuera_jornada,
    observaciones,
    fecha_prevista,
    fecha_inicio,
    fecha_fin,
    horario,
    id_ejecucion,
    eficacia,
    anio,
    coste,
    bonificacion,
    total
)
VALUES
    (
        1,
        'PostgreSQL Avanzado',
        'Curso avanzado de PostgreSQL',
        'Mejora de conocimientos técnicos',
        1,
        'Aula virtual',
        1,
        2,
        20,
        'Dentro',
        'Ninguna',
        '2024-06-01',
        '2024-06-10',
        '2024-06-20',
        '09:00-13:00',
        1,
        'Alta',
        2024,
        1200,
        300,
        900
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

INSERT INTO formacion_trabajador (
    id_formacion,
    id_trabajador,
    asistencia,
    eficacia
)
VALUES
    (1, 1, TRUE, 'Alta'),
    (1, 2, FALSE, 'Pendiente');


-- Documentos para firmar

CREATE TABLE tipo_documento_firma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE documento_firma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_fichero VARCHAR(255),
    id_tipo_documento INT,
    id_trabajador INT,
    link_sharepoint VARCHAR(500),
    estado VARCHAR(45),
    fecha_asignacion DATE,
    FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento_firma(id) ON DELETE SET NULL,
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id) ON DELETE CASCADE
);

CREATE TABLE documento_firma_historial (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento_firma INT,
    nombre_fichero VARCHAR(255),
    link_sharepoint VARCHAR(500),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_documento_firma) REFERENCES documento_firma(id) ON DELETE CASCADE
);

-- Indices

CREATE INDEX idx_trabajador_seleccionadores ON trabajador(id_seleccionadores);
CREATE INDEX idx_trabajador_localidad ON trabajador(id_localidad);
CREATE INDEX idx_asignacion_empresa ON asignacion(id_empresa);
CREATE INDEX idx_asignacion_trabajador ON asignacion(id_trabajador);
CREATE INDEX idx_empresa_tipo ON empresa(id_tipo_empresa);


-- Inserts necesarios

INSERT INTO tipo_empresa (tipo_empresa)
VALUES 
    ('Tecnológica'),
    ('Consultoría'),
    ('Logística'),
    ('Marketing');
