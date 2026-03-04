import type { AiChat } from 'shared';
import { aiChatSchema } from 'shared';

import db from 'db';

const service = db.createService<AiChat>('aiChats', {
  schemaValidator: (obj) => aiChatSchema.parseAsync(obj),
});

service.createIndex({ userId: 1 });
service.createIndex({ userId: 1, updatedOn: -1 });

export default service;
