import type { AiMessage } from 'shared';
import { aiMessageSchema } from 'shared';

import db from 'db';

const service = db.createService<AiMessage>('aiMessages', {
  schemaValidator: (obj) => aiMessageSchema.parseAsync(obj),
});

service.createIndex({ chatId: 1 });
service.createIndex({ chatId: 1, createdOn: 1 });

export default service;
