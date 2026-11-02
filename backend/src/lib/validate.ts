import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';
import { badRequest } from './errors';

/** Wraps a zod schema as Express middleware, replacing req.body with the
 *  parsed (and thus trimmed/typed) result. */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(badRequest(result.error.issues.map((i) => i.message).join('; ')));
      return;
    }
    req.body = result.data;
    next();
  };
}

export const registerSchema = z.object({
  // "Código de estudio": which tenant this account joins. One shared app/API
  // serves every studio, so sign-up has to say which one.
  studioCode: z.string().trim().min(1, 'Falta el código del estudio').toUpperCase(),
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  phone: z.string().trim().min(6, 'Teléfono inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  experienciaPrevia: z.boolean(),
  patologia: z.boolean(),
  patologiaTexto: z.string().trim().max(1000).optional().default(''),
});

export const loginSchema = z.object({
  studioCode: z.string().trim().min(1, 'Falta el código del estudio').toUpperCase(),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Falta la contraseña'),
});

export const classTemplateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida'),
  className: z.string().trim().min(1, 'El nombre de la sesión es obligatorio'),
  coachName: z.string().trim().min(1, 'El instructor/a es obligatorio'),
  capacity: z.number().int().min(1).max(20),
});

export const classTemplatePatchSchema = classTemplateSchema.partial();

export const reminderSettingsSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  reminderChannelApp: z.boolean().optional(),
  reminderChannelWhatsapp: z.boolean().optional(),
});

export const platformLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Falta la contraseña'),
});

export const tenantCreateSchema = z.object({
  code: z.string().trim().min(2, 'El código es obligatorio').toUpperCase(),
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  location: z.string().trim().optional().default(''),
  plan: z.enum(['TRIAL', 'SOLO', 'ESTUDIO', 'CADENA']).optional().default('TRIAL'),
  adminName: z.string().trim().min(2, 'El nombre del administrador es obligatorio'),
  adminEmail: z.string().trim().toLowerCase().email('Email de administrador inválido'),
  adminPhone: z.string().trim().min(6, 'Teléfono inválido'),
  adminPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const tenantPatchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  location: z.string().trim().optional(),
  plan: z.enum(['TRIAL', 'SOLO', 'ESTUDIO', 'CADENA']).optional(),
  planMemberLimit: z.number().int().min(1).optional(),
  planWhatsappEnabled: z.boolean().optional(),
  planMultiSede: z.boolean().optional(),
});
