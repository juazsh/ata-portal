import type { IOffering } from '../models/offering';
import type { IProgram } from '../models/program';

export class InMemoryStore {
  private static instance: InMemoryStore;
  private offerings: Map<string, IOffering> = new Map();
  private programs: Map<string, IProgram> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  public loadOfferings(offerings: IOffering[]) {
    offerings.forEach(o => this.offerings.set(o.id, o));
  }

  public loadPrograms(programs: IProgram[]) {
    programs.forEach(p => this.programs.set(p.id, p));
  }

  public getOfferingById(id: string): IOffering | undefined {
    return this.offerings.get(id);
  }

  public getProgramById(id: string): IProgram | undefined {
    return this.programs.get(id);
  }

  public getAllOfferings(): IOffering[] {
    return Array.from(this.offerings.values());
  }

  public getAllPrograms(): IProgram[] {
    return Array.from(this.programs.values());
  }

  public updateOffering(offering: IOffering) {
    this.offerings.set(offering.id, offering);
  }

  public updateProgram(program: IProgram) {
    this.programs.set(program.id, program);
  }

  public removeOffering(id: string) {
    this.offerings.delete(id);
  }

  public removeProgram(id: string) {
    this.programs.delete(id);
  }
} 