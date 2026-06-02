import { z } from 'zod';
import { SessionVisibility } from './lobby.enums';

export const inviteCodeSchema = z
  .string()
  .min(1, 'Required')
  .transform((value) => value.toUpperCase().replace(/\s/g, ''))
  .pipe(z.string().regex(/^TYC-[A-Z0-9]{4}$/, 'Format: TYC-XXXX'));

export const createSessionSchema = z.object({
  visibility: z.nativeEnum(SessionVisibility),
});

export const joinByCodeSchema = z.object({
  invite_code: inviteCodeSchema,
});

export type CreateSessionFormValues = z.infer<typeof createSessionSchema>;
export type JoinByCodeFormValues = z.infer<typeof joinByCodeSchema>;
