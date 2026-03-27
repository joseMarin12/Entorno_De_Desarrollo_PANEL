
-- Roles y permisos

CREATE TABLE role (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(45) NOT NULL
);

CREATE TABLE permission (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(16) NOT NULL
);

CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    surname VARCHAR(128),
    email VARCHAR(128) UNIQUE NOT NULL,
    role_id INT,
    enabled BOOLEAN DEFAULT TRUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE SET NULL
);

-- Localizaciones

CREATE TABLE localization (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    url VARCHAR(255)
);

CREATE TABLE role_localization_permission (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id INT,
    localization_id INT,
    permission_id INT,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    FOREIGN KEY (localization_id) REFERENCES localization(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
);


-- Comercial y empresas

CREATE TABLE comercial (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL,
    primer_apellido VARCHAR(45),
    segundo_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(128) UNIQUE
);

CREATE TABLE tipo_empresa (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_empresa VARCHAR(45) NOT NULL
);

CREATE TABLE empresa (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_empresa VARCHAR(45) NOT NULL,
    razon_social VARCHAR(128),
    cif VARCHAR(9) UNIQUE,
    id_tipo_empresa INT,
    id_comercial INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tipo_empresa) REFERENCES tipo_empresa(id) ON DELETE SET NULL,
    FOREIGN KEY (id_comercial) REFERENCES comercial(id) ON DELETE SET NULL
);

CREATE TABLE provincia (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provincia VARCHAR(30) NOT NULL
);

CREATE TABLE localidad (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_provincia INT,
    localidad VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_provincia) REFERENCES provincia(id) ON DELETE CASCADE
);

CREATE TABLE direccion_empresa (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    direccion VARCHAR(128),
    codigo_postal VARCHAR(10),
    id_empresa INT,
    id_localidad INT,
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

-- Selecciones y trabajadores

CREATE TABLE seleccion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_seleccion VARCHAR(45) NOT NULL,
    primer_apellido_seleccion VARCHAR(45),
    segundo_apellido_seleccion VARCHAR(45)
);

CREATE TABLE trabajador (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL,
    primer_apellido VARCHAR(45),
    segundo_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(64),
    dni_nif_pasaporte VARCHAR(10) UNIQUE,
    salario DOUBLE PRECISION,
    cheques_guarderia INT,
    cheques_restaurante INT,
    direccion VARCHAR(128),
    nacionalidad VARCHAR(45),
    fecha_nacimiento DATE,
    id_seleccion INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_ini DATE,
    fecha_fin DATE,
    codigo_postal VARCHAR(5),
    id_localidad INT,
    freelance BOOLEAN DEFAULT FALSE,
    id_provincia INT,
    FOREIGN KEY (id_seleccion) REFERENCES seleccion(id) ON DELETE SET NULL,
    FOREIGN KEY (id_localidad) REFERENCES localidad(id) ON DELETE SET NULL,
    FOREIGN KEY (id_provincia) REFERENCES provincia(id) ON DELETE SET NULL
);

-- Documentacion

CREATE TABLE tipoDoc (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo VARCHAR(45) NOT NULL
);

CREATE TABLE documentacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_trabajador INT,
    id_tipoDoc INT,
    doc BYTEA,
    descripcion TEXT,
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tipoDoc) REFERENCES tipoDoc(id) ON DELETE CASCADE
);

-- Asignaciones y headhunting

CREATE TABLE asignacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_empresa INT,
    id_trabajador INT,
    id_comercial INT,
    fecha_ini DATE,
    fecha_fin DATE,
    tarifa DOUBLE PRECISION,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id) ON DELETE CASCADE,
    FOREIGN KEY (id_comercial) REFERENCES comercial(id) ON DELETE SET NULL
);

CREATE TABLE headhunting (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_empresa INT,
    id_seleccion INT,
    nombre VARCHAR(64),
    primer_apellido VARCHAR(64),
    segundo_apellido VARCHAR(64),
    telefono VARCHAR(12),
    email VARCHAR(64),
    fecha_ini DATE,
    salario INT,
    fee INT,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (id_seleccion) REFERENCES seleccion(id) ON DELETE SET NULL
);

-- Formación

CREATE TABLE estado_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

CREATE TABLE area_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE modalidad_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

CREATE TABLE ejecucion_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(45)
);

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
    FOREIGN KEY (id_estado) REFERENCES estado_formacion(id) ON DELETE SET NULL,
    FOREIGN KEY (id_area) REFERENCES area_formacion(id) ON DELETE SET NULL,
    FOREIGN KEY (id_responsable) REFERENCES users(id) ON DELETE SET NULL,
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

CREATE INDEX idx_trabajador_seleccion ON trabajador(id_seleccion);
CREATE INDEX idx_trabajador_localidad ON trabajador(id_localidad);
CREATE INDEX idx_asignacion_empresa ON asignacion(id_empresa);
CREATE INDEX idx_asignacion_trabajador ON asignacion(id_trabajador);
CREATE INDEX idx_empresa_tipo ON empresa(id_tipo_empresa);