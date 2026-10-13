import { expect, it, vi } from 'vitest';
vi.mock('idb', () => ({ openDB: vi.fn(async () => { throw new Error('Quota exceeded'); }) }));
import { enqueue } from './idb';
it('propagates an unavailable outbox instead of claiming the edit was saved', async () => {
  await expect(enqueue([{ type: 'item_update', uuid: 'test', args: { id: 'task' } }])).rejects.toThrow('Unable to save');
});
