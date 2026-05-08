ALTER TABLE documento_firma ADD COLUMN IF NOT EXISTS signaturit_id VARCHAR(100) UNIQUE;
ALTER TABLE documento_firma ADD COLUMN IF NOT EXISTS requiere_firma_rrhh BOOLEAN DEFAULT FALSE;
ALTER TABLE documento_firma ADD COLUMN IF NOT EXISTS id_user_rrhh INT;
ALTER TABLE documento_firma ADD COLUMN IF NOT EXISTS fecha_firma_trabajador TIMESTAMP;
ALTER TABLE documento_firma ADD COLUMN IF NOT EXISTS fecha_firma_rrhh TIMESTAMP;
ALTER TABLE documento_firma ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Solo agregamos la llave foránea si no existe previamente
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_rrhh') THEN
        ALTER TABLE documento_firma ADD CONSTRAINT fk_user_rrhh FOREIGN KEY (id_user_rrhh) REFERENCES "user"(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS documento_firma_historial (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento_firma INT,
    nombre_fichero VARCHAR(255),
    link_sharepoint VARCHAR(500),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_documento_firma) REFERENCES documento_firma(id) ON DELETE CASCADE
);
