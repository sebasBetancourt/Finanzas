import bcrypt from 'bcryptjs';
import pool from './db';

const ADMIN_EMAIL = 's3basbetan@gmail.com';
const ADMIN_PASSWORD = 'sebas1234';
const ADMIN_NOMBRE = 'Sebas';
const ADMIN_APELLIDO = 'Betancourt';

/**
 * Solo estructura de BD al arrancar.
 * NUNCA inserta, actualiza ni borra ítems del tablero del usuario.
 */
export async function runStartupMigrations(): Promise<void> {
  console.log('[MIGRATIONS] Running startup migrations...');

  try {
    await ensureUsuariosTable();

    await pool.query(`
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS rol VARCHAR(30) NOT NULL DEFAULT 'usuario'
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_rol_check'
        ) THEN
          ALTER TABLE usuarios
            ADD CONSTRAINT usuarios_rol_check
            CHECK (rol IN ('admin', 'usuario'));
        END IF;
      END $$;
    `);

    await seedAdminUser();
    await ensureItemsFinancierosTable();
    await ensureDebtPlanColumns();
    await ensurePresupuestosMesTable();

    console.log('[MIGRATIONS] Startup migrations completed (sin tocar datos del tablero)');
  } catch (error) {
    console.error('[MIGRATIONS] Failed:', error);
    throw error;
  }
}

async function ensureUsuariosTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario       SERIAL PRIMARY KEY,
      email            VARCHAR(255) NOT NULL UNIQUE,
      password_hash    VARCHAR(255) NOT NULL,
      nombre           VARCHAR(100) NOT NULL,
      apellido         VARCHAR(100),
      moneda           VARCHAR(3) NOT NULL DEFAULT 'COP',
      timezone         VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
      rol              VARCHAR(30) NOT NULL DEFAULT 'usuario',
      estado           VARCHAR(20) NOT NULL DEFAULT 'activo',
      creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureItemsFinancierosTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items_financieros (
      id_item          SERIAL PRIMARY KEY,
      id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      titulo           VARCHAR(200) NOT NULL,
      tipo             VARCHAR(30) NOT NULL
                       CHECK (tipo IN ('ingreso', 'gasto', 'deuda', 'inversion', 'ahorro')),
      monto_total      NUMERIC(14, 2) NOT NULL CHECK (monto_total >= 0),
      monto_pagado     NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
      estado           VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente', 'programado', 'en_proceso', 'ahorro', 'completado', 'cancelado')),
      fecha            DATE,
      notas            TEXT,
      creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'items_financieros_estado_check'
      ) THEN
        ALTER TABLE items_financieros DROP CONSTRAINT items_financieros_estado_check;
      END IF;
      ALTER TABLE items_financieros
        ADD CONSTRAINT items_financieros_estado_check
        CHECK (estado IN ('pendiente', 'programado', 'en_proceso', 'ahorro', 'completado', 'cancelado'));
    END $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_items_usuario ON items_financieros(id_usuario)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_items_usuario_estado ON items_financieros(id_usuario, estado)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_items_usuario_tipo ON items_financieros(id_usuario, tipo)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_items_usuario_fecha ON items_financieros(id_usuario, fecha)`);

  console.log('[MIGRATIONS] items_financieros table ensured');
}

async function ensureDebtPlanColumns(): Promise<void> {
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS id_item_padre INTEGER`);
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS cuota_mensual NUMERIC(14, 2)`);
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS n_cuotas INTEGER`);
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS cuotas_pagadas INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS dia_cobro INTEGER DEFAULT 1`);
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS cuota_inicial NUMERIC(14, 2) DEFAULT 0`);
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS es_recurrente BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`ALTER TABLE items_financieros ADD COLUMN IF NOT EXISTS fecha_inicio DATE`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'items_financieros_id_item_padre_fkey'
      ) THEN
        ALTER TABLE items_financieros
          ADD CONSTRAINT items_financieros_id_item_padre_fkey
          FOREIGN KEY (id_item_padre) REFERENCES items_financieros(id_item) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_items_padre ON items_financieros(id_item_padre)`);
  console.log('[MIGRATIONS] debt plan columns ensured');
}

async function ensurePresupuestosMesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS presupuestos_mes (
      id_presupuesto   SERIAL PRIMARY KEY,
      id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      anio             INTEGER NOT NULL,
      mes              INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
      ingreso_total    NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (ingreso_total >= 0),
      notas            TEXT,
      creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (id_usuario, anio, mes)
    )
  `);
  console.log('[MIGRATIONS] presupuestos_mes table ensured');
}

/** Solo crea el admin si no existe. No pisa password ni datos si ya está. */
async function seedAdminUser(): Promise<void> {
  const email = ADMIN_EMAIL.toLowerCase();

  const existing = await pool.query(
    `SELECT id_usuario FROM usuarios WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (existing.rows.length > 0) {
    console.log(`[MIGRATIONS] Admin already exists (sin modificar): ${email}`);
    return;
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await pool.query(
    `INSERT INTO usuarios (email, password_hash, nombre, apellido, moneda, rol, estado)
     VALUES ($1, $2, $3, $4, 'COP', 'admin', 'activo')`,
    [email, password_hash, ADMIN_NOMBRE, ADMIN_APELLIDO]
  );
  console.log(`[MIGRATIONS] Admin user created: ${email}`);
}
