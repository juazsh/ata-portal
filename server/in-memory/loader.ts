import { InMemoryStore } from './InMemoryStore';
import { Offering, Program } from '../models/program';
import type { IOffering, IProgram } from '../models/program';

export async function loadInMemoryStore() {
  const store = InMemoryStore.getInstance();
  const programs: IProgram[] = await Program.find({}).lean();
  store.loadPrograms(programs);
  const offerings: IOffering[] = await Offering.find({}).lean();
  store.loadOfferings(offerings);

  console.log('[InMemoryStore] Loaded offerings and programs into memory.');
} 