import { type Diagnostico, validateDiagnostico } from '../domain/diagnostico.ts';
import type { DiagnosisInput, Judge } from './ports.ts';

/**
 * Use case: ask the judge for a diagnosis, then re-validate it against the
 * domain contract before trusting it. Tool use forces the shape; this guards
 * the sanity (enums, non-empty fields) - control, not faith.
 */
export async function gerarDiagnostico(judge: Judge, input: DiagnosisInput): Promise<Diagnostico> {
  const raw = await judge.diagnose(input);
  return validateDiagnostico(raw);
}
