import { selectTaskSchema } from '@/db/schema';
import { z } from 'zod';

export type AppTask = z.infer<typeof selectTaskSchema>;
