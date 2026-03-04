import { z } from 'zod';

const schema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
});

export default schema.parse(process.env);
