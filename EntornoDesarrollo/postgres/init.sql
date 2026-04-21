CREATE DATABASE sgtech_v3;

\c sgtech_v3;

CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45)
);

CREATE TABLE permission (
    id SERIAL PRIMARY KEY,
    name VARCHAR(16)
);

CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45),
    surname VARCHAR(128),
    email VARCHAR(128),
    roleId INT,
    enabled BOOLEAN,
    password VARCHAR(32),
    FOREIGN KEY (roleId) REFERENCES role(id)
);

CREATE TABLE localization (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255)
);

CREATE TABLE role_localization_permission (
    id SERIAL PRIMARY KEY,
    roleId INT,
    localizationId INT,
    permissionId INT,
    FOREIGN KEY (roleId) REFERENCES role(id),
    FOREIGN KEY (localizationId) REFERENCES localization(id),
    FOREIGN KEY (permissionId) REFERENCES permission(id)
);

CREATE TABLE comercial (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(45),
    primer_apellido VARCHAR(45),
    segundo_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(128)
);

CREATE TABLE tipo_empresa (
    id SERIAL PRIMARY KEY,
    tipo_empresa VARCHAR(45)
);

CREATE TABLE empresa (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(45),
    razon_social VARCHAR(128),
    cif VARCHAR(9),
    id_tipo_empresa INT,
    id_comerciales INT,  --cambie el nombre de la columna para que coincida con la tabla comerciales
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, --fecha de actualizacion de la empresa
    FOREIGN KEY (id_tipo_empresa) REFERENCES tipo_empresa(id) ON DELETE SET NULL,
    FOREIGN KEY (id_comerciales) REFERENCES comerciales(id) ON DELETE SET NULL  --cambie el nombre de la columna para que coincida con la tabla comerciales
);

CREATE TABLE pais ( --cree la tabla pais
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pais VARCHAR(45) NOT NULL
);

CREATE TABLE provincia (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pais INT,
    provincia VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_pais) REFERENCES pais(id) ON DELETE CASCADE
);

CREATE TABLE localidad (
    id SERIAL PRIMARY KEY,
    id_provincia INT,
    localidad VARCHAR(100),
    FOREIGN KEY (id_provincia) REFERENCES provincia(id)
);

CREATE TABLE direccion_empresa (
    id SERIAL PRIMARY KEY,
    direccion VARCHAR(128),
    codigo_postal VARCHAR(10),
    id_empresa INT,
    id_localidad INT,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id),
    FOREIGN KEY (id_localidad) REFERENCES localidad(id)
);

CREATE TABLE contacto_empresa (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(45),
    primer_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(128),
    cargo VARCHAR(45),
    id_empresa INT,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id)
);

CREATE TABLE seleccion (
    id SERIAL PRIMARY KEY,
    nombre_seleccion VARCHAR(45),
    primer_apellido_seleccion VARCHAR(45),
    segundo_apellido_seleccion VARCHAR(45)
);

CREATE TABLE trabajador (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(45),
    primer_apellido VARCHAR(45),
    segundo_apellido VARCHAR(45),
    telefono VARCHAR(20),
    email VARCHAR(64),
    dni_nif_pasaporte VARCHAR(10),
    salario DOUBLE PRECISION,
    cheques_guarderia INT,
    cheques_restaurante INT,
    direccion VARCHAR(128),
    nacionalidad VARCHAR(45),
    fecha_nacimiento DATE,
    id_seleccionadores INT, -- Referencia a la nueva tabla unificada
    activo BOOLEAN DEFAULT TRUE,
    fecha_ini DATE,
    fecha_fin DATE,
    codigo_postal VARCHAR(5),
    id_localidad INT,
    freelance BOOLEAN,
    id_provincia INT,
    FOREIGN KEY (id_seleccionadores) REFERENCES seleccionadores(id) ON DELETE SET NULL,
    FOREIGN KEY (id_localidad) REFERENCES localidad(id) ON DELETE SET NULL,
    FOREIGN KEY (id_provincia) REFERENCES provincia(id) ON DELETE SET NULL
);

CREATE TABLE tipoDoc (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(45)
);

CREATE TABLE documentacion (
    id SERIAL PRIMARY KEY,
    id_trabajador INT,
    id_tipoDoc INT,
    doc BYTEA,
    descripcion VARCHAR(45),
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id),
    FOREIGN KEY (id_tipoDoc) REFERENCES tipoDoc(id)
);

CREATE TABLE asignacion (
    id SERIAL PRIMARY KEY,
    id_empresa INT,
    id_trabajador INT,
    id_comercial INT,
    fecha_ini DATE,
    fecha_fin DATE,
    tarifa DOUBLE PRECISION,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id),
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id),
    FOREIGN KEY (id_comercial) REFERENCES comercial(id)
);

CREATE TABLE headhunting (
    id SERIAL PRIMARY KEY,
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
    FOREIGN KEY (id_empresa) REFERENCES empresa(id),
    FOREIGN KEY (id_seleccion) REFERENCES seleccion(id)
);

CREATE TABLE estado_formacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(45)
);

CREATE TABLE area_formacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100)
);

CREATE TABLE modalidad_formacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(45)
);

CREATE TABLE ejecucion_formacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(45)
);

CREATE TABLE formacion (
    id SERIAL PRIMARY KEY,
    id_estado INT,
    curso VARCHAR(100),
    denominacion VARCHAR(255),
    motivo VARCHAR(255),
    id_area INT,
    recursos VARCHAR(255),
    id_responsable INT,
    id_modalidad INT,
    duracion INT,
    dentro_fuera_jornada VARCHAR(20),
    observaciones VARCHAR(255),
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
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estado) REFERENCES estado_formacion(id),
    FOREIGN KEY (id_area) REFERENCES area_formacion(id),
    FOREIGN KEY (id_responsable) REFERENCES "user"(id),
    FOREIGN KEY (id_modalidad) REFERENCES modalidad_formacion(id),
    FOREIGN KEY (id_ejecucion) REFERENCES ejecucion_formacion(id)
);

CREATE TABLE formacion_trabajador (
    id SERIAL PRIMARY KEY,
    id_formacion INT,
    id_trabajador INT,
    asistencia BOOLEAN,
    eficacia VARCHAR(45),
    FOREIGN KEY (id_formacion) REFERENCES formacion(id),
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id)
);

CREATE TABLE tipo_documento_firma (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100)
);

CREATE TABLE documento_firma (
    id SERIAL PRIMARY KEY,
    nombre_fichero VARCHAR(255),
    id_tipo_documento INT,
    id_trabajador INT,
    link_sharepoint VARCHAR(500),
    estado VARCHAR(45),
    fecha_asignacion DATE,
    FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento_firma(id),
    FOREIGN KEY (id_trabajador) REFERENCES trabajador(id)
);

CREATE TABLE documento_firma_historial (
    id SERIAL PRIMARY KEY,
    id_documento_firma INT,
    nombre_fichero VARCHAR(255),
    link_sharepoint VARCHAR(500),
    fecha_subida TIMESTAMP,
    FOREIGN KEY (id_documento_firma) REFERENCES documento_firma(id)
);

-- Indices

CREATE INDEX idx_trabajador_seleccionadores ON trabajador(id_seleccionadores);
CREATE INDEX idx_trabajador_localidad ON trabajador(id_localidad);
CREATE INDEX idx_asignacion_empresa ON asignacion(id_empresa);
CREATE INDEX idx_asignacion_trabajador ON asignacion(id_trabajador);
CREATE INDEX idx_empresa_tipo ON empresa(id_tipo_empresa);
