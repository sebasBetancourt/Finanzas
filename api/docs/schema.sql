-- Schema inicial — Finanzas y Metas Personales
-- Compatible con PostgreSQL 15

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario       SERIAL PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100),
  moneda           VARCHAR(3) NOT NULL DEFAULT 'COP',
  timezone         VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
  estado           VARCHAR(20) NOT NULL DEFAULT 'activo',
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sueños (visión a largo plazo)
CREATE TABLE IF NOT EXISTS suenos (
  id_sueno         SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  imagen_url       TEXT,
  prioridad        SMALLINT NOT NULL DEFAULT 3 CHECK (prioridad BETWEEN 1 AND 5),
  estado           VARCHAR(30) NOT NULL DEFAULT 'activo'
                   CHECK (estado IN ('activo', 'en_progreso', 'logrado', 'archivado')),
  fecha_objetivo   DATE,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metas (objetivos medibles, opcionalmente ligados a un sueño)
CREATE TABLE IF NOT EXISTS metas (
  id_meta          SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_sueno         INTEGER REFERENCES suenos(id_sueno) ON DELETE SET NULL,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  tipo             VARCHAR(40) NOT NULL DEFAULT 'personal'
                   CHECK (tipo IN ('personal', 'financiera', 'salud', 'carrera', 'otro')),
  valor_objetivo   NUMERIC(14, 2),
  valor_actual     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  unidad           VARCHAR(40) DEFAULT 'COP',
  fecha_inicio     DATE,
  fecha_fin        DATE,
  progreso_pct     NUMERIC(5, 2) NOT NULL DEFAULT 0,
  estado           VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Planes / estrategias por meta
CREATE TABLE IF NOT EXISTS planes_estrategia (
  id_plan          SERIAL PRIMARY KEY,
  id_meta          INTEGER NOT NULL REFERENCES metas(id_meta) ON DELETE CASCADE,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  pasos            JSONB NOT NULL DEFAULT '[]',
  estado           VARCHAR(30) NOT NULL DEFAULT 'activo'
                   CHECK (estado IN ('activo', 'pausado', 'completado', 'archivado')),
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rutinas / hábitos
CREATE TABLE IF NOT EXISTS rutinas (
  id_rutina        SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_meta          INTEGER REFERENCES metas(id_meta) ON DELETE SET NULL,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  frecuencia       VARCHAR(30) NOT NULL DEFAULT 'diaria'
                   CHECK (frecuencia IN ('diaria', 'semanal', 'mensual')),
  dias_semana      SMALLINT[] DEFAULT '{}',
  hora_preferida   TIME,
  activo           BOOLEAN NOT NULL DEFAULT true,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tareas / calendario
CREATE TABLE IF NOT EXISTS tareas (
  id_tarea         SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_meta          INTEGER REFERENCES metas(id_meta) ON DELETE SET NULL,
  id_rutina        INTEGER REFERENCES rutinas(id_rutina) ON DELETE SET NULL,
  id_plan          INTEGER REFERENCES planes_estrategia(id_plan) ON DELETE SET NULL,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  fecha_programada DATE NOT NULL,
  hora_inicio      TIME,
  hora_fin         TIME,
  completada       BOOLEAN NOT NULL DEFAULT false,
  prioridad        SMALLINT NOT NULL DEFAULT 3 CHECK (prioridad BETWEEN 1 AND 5),
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metas de ahorro
CREATE TABLE IF NOT EXISTS metas_ahorro (
  id_ahorro        SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_meta          INTEGER REFERENCES metas(id_meta) ON DELETE SET NULL,
  nombre           VARCHAR(200) NOT NULL,
  monto_objetivo   NUMERIC(14, 2) NOT NULL,
  monto_actual     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fecha_objetivo   DATE,
  aporte_sugerido  NUMERIC(14, 2),
  estado           VARCHAR(30) NOT NULL DEFAULT 'activa'
                   CHECK (estado IN ('activa', 'completada', 'pausada', 'cancelada')),
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aportes_ahorro (
  id_aporte        SERIAL PRIMARY KEY,
  id_ahorro        INTEGER NOT NULL REFERENCES metas_ahorro(id_ahorro) ON DELETE CASCADE,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  monto            NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
  nota             TEXT,
  fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorías de movimiento
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria     SERIAL PRIMARY KEY,
  id_usuario       INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nombre           VARCHAR(100) NOT NULL,
  slug             VARCHAR(100) NOT NULL,
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  color            VARCHAR(20) DEFAULT '#0c4136',
  icono            VARCHAR(40),
  estado           VARCHAR(20) NOT NULL DEFAULT 'activo',
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Movimientos financieros
CREATE TABLE IF NOT EXISTS movimientos (
  id_movimiento    SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_categoria     INTEGER REFERENCES categorias(id_categoria) ON DELETE SET NULL,
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto            NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
  concepto         VARCHAR(255) NOT NULL,
  descripcion      TEXT,
  fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
  es_recurrente    BOOLEAN NOT NULL DEFAULT false,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_suenos_usuario ON suenos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_metas_usuario ON metas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_metas_sueno ON metas(id_sueno);
CREATE INDEX IF NOT EXISTS idx_tareas_usuario_fecha ON tareas(id_usuario, fecha_programada);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_fecha ON movimientos(id_usuario, fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_categoria ON movimientos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_ahorros_usuario ON metas_ahorro(id_usuario);

-- INSERT idempotente: globales usan slug+tipo con id_usuario NULL
CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_globales
  ON categorias (slug, tipo) WHERE id_usuario IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_usuario
  ON categorias (id_usuario, slug, tipo) WHERE id_usuario IS NOT NULL;

-- Categorías globales por defecto (id_usuario NULL)
INSERT INTO categorias (id_usuario, nombre, slug, tipo, color, icono)
SELECT * FROM (VALUES
  (NULL::integer, 'Salario', 'salario', 'ingreso', '#0c4136', 'wallet'),
  (NULL, 'Freelance', 'freelance', 'ingreso', '#1a6b55', 'briefcase'),
  (NULL, 'Inversiones', 'inversiones', 'ingreso', '#e7b61d', 'trending-up'),
  (NULL, 'Otros ingresos', 'otros_ingresos', 'ingreso', '#b1c1e4', 'plus'),
  (NULL, 'Vivienda', 'vivienda', 'egreso', '#b76a07', 'home'),
  (NULL, 'Alimentación', 'alimentacion', 'egreso', '#d7f313', 'utensils'),
  (NULL, 'Transporte', 'transporte', 'egreso', '#a197ad', 'car'),
  (NULL, 'Salud', 'salud', 'egreso', '#0c4136', 'heart'),
  (NULL, 'Educación', 'educacion', 'egreso', '#e7b61d', 'book'),
  (NULL, 'Ocio', 'ocio', 'egreso', '#b48000', 'smile'),
  (NULL, 'Ahorro', 'ahorro', 'egreso', '#1a6b55', 'piggy-bank'),
  (NULL, 'Otros gastos', 'otros_gastos', 'egreso', '#888888', 'more-horizontal')
) AS v(id_usuario, nombre, slug, tipo, color, icono)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias c WHERE c.id_usuario IS NULL AND c.slug = v.slug AND c.tipo = v.tipo
);
