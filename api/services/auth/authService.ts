import bcrypt from 'bcryptjs';
import { AuthRepository } from '../../repositories/auth.repository';
import { RegisterData, LoginData } from '../../interfaces/auth.interface';

const repo = new AuthRepository();

export class RegisterServiceClass {
  async execute(input: RegisterData) {
    try {
      const existing = await repo.findByEmail(input.email);
      if (existing.error) {
        return { data: null, error: { status: 500, message: 'Error al verificar email', details: existing.error } };
      }
      if (existing.data) {
        return { data: null, error: { status: 409, message: 'El email ya está registrado', details: null } };
      }

      const password_hash = await bcrypt.hash(input.password, 10);
      const { data, error } = await repo.create({ ...input, password_hash });
      if (error) {
        return { data: null, error: { status: 500, message: 'Error al crear usuario', details: error } };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { status: 500, message: 'Error interno', details: error } };
    }
  }
}

export class LoginServiceClass {
  async execute(input: LoginData) {
    try {
      const { data: user, error } = await repo.findByEmail(input.email);
      if (error) {
        return { data: null, error: { status: 500, message: 'Error al buscar usuario', details: error } };
      }
      if (!user || user.estado !== 'activo') {
        return { data: null, error: { status: 401, message: 'Credenciales inválidas', details: null } };
      }

      const valid = await bcrypt.compare(input.password, user.password_hash);
      if (!valid) {
        return { data: null, error: { status: 401, message: 'Credenciales inválidas', details: null } };
      }

      const { password_hash: _, ...safeUser } = user;
      return { data: safeUser, error: null };
    } catch (error) {
      return { data: null, error: { status: 500, message: 'Error interno', details: error } };
    }
  }
}

export class MeServiceClass {
  async execute(userId: number) {
    try {
      const { data, error } = await repo.findById(userId);
      if (error) {
        return { data: null, error: { status: 500, message: 'Error al obtener perfil', details: error } };
      }
      if (!data) {
        return { data: null, error: { status: 404, message: 'Usuario no encontrado', details: null } };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { status: 500, message: 'Error interno', details: error } };
    }
  }
}

export const registerService = new RegisterServiceClass();
export const loginService = new LoginServiceClass();
export const meService = new MeServiceClass();
