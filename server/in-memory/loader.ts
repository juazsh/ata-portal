import { store } from './store';
import { Offering } from '../models/offering';
import { Program } from '../models/program';
import type { IOffering } from '../models/offering';
import type { IProgram } from '../models/program';

export async function loadInMemoryStore() {
  try {
    const offerings: IOffering[] = await Offering.find({}).lean();
    store.loadOfferings(offerings);

    const programs: IProgram[] = await Program.find({}).lean();
    store.loadPrograms(programs);

    console.log('[InMemoryStore] Loaded offerings and programs into memory.');
  } catch (error) {
    console.error('[InMemoryStore] Error loading data:', error);
    throw error;
  }
} 