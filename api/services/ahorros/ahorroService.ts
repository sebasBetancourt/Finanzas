import { AhorroRepository } from '../../repositories/ahorro.repository';
import { CreateAhorroData, UpdateAhorroData, CreateAporteData } from '../../interfaces/ahorro.interface';

const repo = new AhorroRepository();

export class AhorroServiceClass {
  async list(userId: number) {
    const { data, error } = await repo.list(userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar ahorros', details: error } };
    return { data, error: null };
  }
  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener ahorro', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Meta de ahorro no encontrada', details: null } };
    return { data, error: null };
  }
  async create(userId: number, input: CreateAhorroData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear ahorro', details: error } };
    return { data, error: null };
  }
  async update(userId: number, id: number, input: UpdateAhorroData) {
    if (!(await repo.getById(id, userId)).data) return { data: null, error: { status: 404, message: 'Meta de ahorro no encontrada', details: null } };
    const { data, error } = await repo.update(id, userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar ahorro', details: error } };
    return { data, error: null };
  }
  async remove(userId: number, id: number) {
    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar ahorro', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Meta de ahorro no encontrada', details: null } };
    return { data: true, error: null };
  }
  async addAporte(userId: number, id: number, input: CreateAporteData) {
    const { data, error } = await repo.addAporte(id, userId, input);
    if (error?.notFound) return { data: null, error: { status: 404, message: 'Meta de ahorro no encontrada', details: null } };
    if (error) return { data: null, error: { status: 500, message: 'Error al registrar aporte', details: error } };
    return { data, error: null };
  }
  async listAportes(userId: number, id: number) {
    const { data, error } = await repo.listAportes(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar aportes', details: error } };
    return { data, error: null };
  }
}

export const ahorroService = new AhorroServiceClass();
