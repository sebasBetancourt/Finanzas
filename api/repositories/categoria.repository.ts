import pool from '../libs/db';
import { CreateCategoriaData, Categoria } from '../interfaces/categoria.interface';

function slugify(nombre: string) {
  return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_]/g, '').trim().replace(/\s+/g, '_');
}

export class CategoriaRepository {
  async list(id_usuario: number, tipo?: string): Promise<{ data: Categoria[] | null; error: any }> {
    try {
      const cond = [`(c.id_usuario IS NULL OR c.id_usuario = $1)`, `c.estado = 'activo'`];
      const vals: any[] = [id_usuario];
      let i = 2;
      if (tipo) { cond.push(`c.tipo = $${i++}`); vals.push(tipo); }
      const { rows } = await pool.query(
        `SELECT * FROM categorias c WHERE ${cond.join(' AND ')} ORDER BY c.id_usuario NULLS FIRST, c.nombre`,
        vals
      );
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async create(id_usuario: number, data: CreateCategoriaData): Promise<{ data: Categoria | null; error: any }> {
    try {
      const slug = data.slug || slugify(data.nombre);
      const { rows } = await pool.query(
        `INSERT INTO categorias (id_usuario, nombre, slug, tipo, color, icono)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [id_usuario, data.nombre, slug, data.tipo, data.color || '#0c4136', data.icono || null]
      );
      return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
  }
}
