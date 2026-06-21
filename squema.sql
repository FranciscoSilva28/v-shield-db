-- 1. Crear tabla de empresas
CREATE TABLE public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_empresa VARCHAR(150) NOT NULL,
    sector TEXT[], 
    datos_scraping TEXT, -- Almacena el perfil de riesgo en formato Markdown
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de empleados
CREATE TABLE public.empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(25) NOT NULL,
    correo_electronico VARCHAR(150) NOT NULL CHECK (correo_electronico ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    departamento VARCHAR(100) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de repertorio de voces (ElevenLabs)
CREATE TABLE public.repertorio_voces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
    elevenlabs_voice_id VARCHAR(100) NOT NULL UNIQUE,
    esta_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. NUEVA TABLA MAESTRA: sesiones (Unifica llamadas, WhatsApp y simulaciones)
CREATE TABLE public.sesiones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE, -- La victima atacada
    voz_id UUID REFERENCES public.repertorio_voces(id) ON DELETE SET NULL,       -- Audio clonado usado (opcional para texto)
    tipo_canal VARCHAR(30) NOT NULL CHECK (tipo_canal IN ('WEBRTC', 'ALTUR', 'WHATSAPP', 'SMS', 'EMAIL')),
    estado VARCHAR(20) DEFAULT 'active' CHECK (estado IN ('active', 'done', 'error', 'pendiente')),
    token_rastreo UUID DEFAULT gen_random_uuid() UNIQUE NULL, -- Para links maliciosos o rastreo externo
    segundos_en_caer INTEGER NULL,
    resumen_markdown TEXT NULL, -- El reporte final generado por la IA
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_fin TIMESTAMP WITH TIME ZONE NULL
);

-- 5. TABLA DE TRANSCRIPCION: mensajes_sesion (Historial y roles de IA)
CREATE TABLE public.mensajes_sesion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sesion_id UUID NOT NULL REFERENCES public.sesiones(id) ON DELETE CASCADE,
    rol VARCHAR(20) DEFAULT 'user' CHECK (rol IN ('user', 'assistant', 'system')), -- Adaptacion nativa para LLMs
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contenido TEXT NOT NULL,
    metadatos JSONB -- Almacena intenciones, latencias o estatus de lectura
);

-- 6. TABLA DE REPORTES: (PDFs finales generados post-ataque)
CREATE TABLE public.reportes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sesion_id UUID REFERENCES public.sesiones(id) ON DELETE CASCADE UNIQUE, 
    pdf_url TEXT NOT NULL,
    fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- LOGICA DE PROGRAMACION INTERNA (TRIGGERS DE SEGURIDAD)
-- =================================================================

-- Funcion para evitar que un empleado sea atacado con su propia voz
CREATE OR REPLACE FUNCTION public.verificar_autosuplantacion_circular()
RETURNS TRIGGER AS $$
DECLARE
    id_empleado_voz UUID;
BEGIN
    -- Solo verifica si el ataque involucra una voz clonada
    IF NEW.voz_id IS NOT NULL THEN
        SELECT empleado_id INTO id_empleado_voz
        FROM public.repertorio_voces
        WHERE id = NEW.voz_id;

        IF NEW.empleado_id = id_empleado_voz THEN
            RAISE EXCEPTION 'Violacion de Seguridad Logica: No se puede enviar una sesion a un empleado usando su propia voz clonada.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar el trigger a la tabla de sesiones
CREATE TRIGGER trg_prevenir_autosuplantacion
    BEFORE INSERT OR UPDATE ON public.sesiones
    FOR EACH ROW
    EXECUTE FUNCTION public.verificar_autosuplantacion_circular();

-- =================================================================
-- CREACION DE INDICES DE ALTO RENDIMIENTO
-- =================================================================

CREATE INDEX idx_empresas_sector ON public.empresas USING GIN (sector);
CREATE INDEX idx_empleados_empresa ON public.empleados(empresa_id);
CREATE INDEX idx_repertorio_empleado ON public.repertorio_voces(empleado_id);
CREATE INDEX idx_sesiones_empleado ON public.sesiones(empleado_id);
CREATE INDEX idx_sesiones_voz ON public.sesiones(voz_id);
CREATE INDEX idx_sesiones_canal ON public.sesiones(tipo_canal);
CREATE INDEX idx_sesiones_token ON public.sesiones(token_rastreo);
CREATE INDEX idx_mensajes_sesion_rapida ON public.mensajes_sesion(sesion_id);
CREATE INDEX idx_mensajes_sesion_rol ON public.mensajes_sesion(rol);
CREATE INDEX idx_reportes_sesion ON public.reportes(sesion_id);
