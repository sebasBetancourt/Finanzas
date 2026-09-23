import { KpiRepository } from '../../repositories/kpi.repository';

const repo = new KpiRepository();

export class KpiServiceClass {
  async dashboard(userId: number) {
    const { data, error } = await repo.getDashboard(userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener KPIs', details: error } };
    return { data, error: null };
  }
}

export const kpiService = new KpiServiceClass();
