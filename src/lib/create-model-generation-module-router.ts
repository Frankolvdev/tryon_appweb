import type { GenerationExecutionEngine, GenerationModule } from "@/types/generation";

export type CreateModelIdentityMode = "create" | "existing";
export type CreateModelExecutionAudience =
  | "commercial_remote"
  | "commercial_local"
  | "owner_local";

type ExpectedInput = {
  key: string;
  name: string;
  type: "float" | "text" | "image";
  required: boolean;
};

type ExpectedOutput = {
  key: "output_1" | "output_2";
  name: string;
  type: "image";
  required: boolean;
};

export type GenerationModuleContract = {
  moduleId: number;
  key: string;
  name: string;
  version?: number;
  allowedEngines?: readonly GenerationExecutionEngine[];
  inputs: readonly ExpectedInput[];
  outputs: readonly ExpectedOutput[];
};

const CREATE_MODEL_BASE_INPUTS = [
  { key: "input_1", name: "Hips SIze", type: "float", required: true },
  { key: "input_2", name: "Fat - Thin", type: "float", required: true },
  { key: "input_3", name: "Breasts Size", type: "float", required: true },
  { key: "input_4", name: "Skin Tone", type: "float", required: true },
  { key: "input_5", name: "Hair Length", type: "float", required: true },
  { key: "input_6", name: "Butt Elevation", type: "float", required: true },
  { key: "input_7", name: "Pose", type: "text", required: true },
  { key: "input_8", name: "On", type: "text", required: true },
  { key: "input_9", name: "view", type: "text", required: true },
  { key: "input_10", name: "Action", type: "text", required: true },
  { key: "input_11", name: "Place", type: "text", required: true },
  { key: "input_12", name: "time_day_weather_or_lighting", type: "text", required: true },
  { key: "input_13", name: "Clothes", type: "text", required: true },
  { key: "input_14", name: "extra_details", type: "text", required: false },
] as const satisfies readonly ExpectedInput[];

const CREATE_MODEL_OUTPUTS = [
  { key: "output_1", name: "all body", type: "image", required: true },
  { key: "output_2", name: "head", type: "image", required: true },
] as const satisfies readonly ExpectedOutput[];

const createPromptInputs = [
  ...CREATE_MODEL_BASE_INPUTS,
  { key: "input_15", name: "prompt_head", type: "text", required: true },
] as const satisfies readonly ExpectedInput[];

const createFromHeadInputs = [
  ...CREATE_MODEL_BASE_INPUTS,
  { key: "input_15", name: "head", type: "image", required: true },
] as const satisfies readonly ExpectedInput[];

const OWNER_LOCAL_ENGINES = ["local_docker", "owner_local"] as const satisfies readonly GenerationExecutionEngine[];
const COMMERCIAL_LOCAL_ENGINES = ["local_docker"] as const satisfies readonly GenerationExecutionEngine[];

const REMOTE_CREATE_CONTRACT = {
  moduleId: 4,
  key: "create_model_woman",
  name: "Create Model Woman",
  inputs: createPromptInputs,
  outputs: CREATE_MODEL_OUTPUTS,
} as const satisfies GenerationModuleContract;

const REMOTE_EXISTING_CONTRACT = {
  moduleId: 5,
  key: "create_model_woman",
  name: "Create Model Woman From Head",
  version: 2,
  inputs: createFromHeadInputs,
  outputs: CREATE_MODEL_OUTPUTS,
} as const satisfies GenerationModuleContract;

const LOCAL_CREATE_BASE = {
  moduleId: 6,
  key: "create_model_woman",
  name: "Create Model Woman Owner",
  version: 3,
  inputs: createPromptInputs,
  outputs: CREATE_MODEL_OUTPUTS,
} as const;

const LOCAL_EXISTING_BASE = {
  moduleId: 7,
  key: "create_model_woman",
  name: "Create Model Woman From Head Owner",
  version: 4,
  inputs: createFromHeadInputs,
  outputs: CREATE_MODEL_OUTPUTS,
} as const;

/**
 * Central routing table for Create Model IA.
 *
 * Important separation:
 * - commercial_remote: historical modules 4/5 (unchanged fallback).
 * - commercial_local: modules 6/7 only when they are published as local_docker.
 *   Backend keeps accounting_mode=commercial, so tokens/pricing stay normal.
 * - owner_local: the same local-optimized modules 6/7. Backend independently
 *   forces engine=owner_local and accounting_mode=owner_private.
 *
 * AppWeb only chooses the module contract. It never decides billing/accounting.
 */
export const CREATE_MODEL_GENERATION_CONTRACTS = {
  commercial_remote: {
    create: REMOTE_CREATE_CONTRACT,
    existing: REMOTE_EXISTING_CONTRACT,
  },
  commercial_local: {
    create: {
      ...LOCAL_CREATE_BASE,
      allowedEngines: COMMERCIAL_LOCAL_ENGINES,
    },
    existing: {
      ...LOCAL_EXISTING_BASE,
      allowedEngines: COMMERCIAL_LOCAL_ENGINES,
    },
  },
  owner_local: {
    create: {
      ...LOCAL_CREATE_BASE,
      allowedEngines: OWNER_LOCAL_ENGINES,
    },
    existing: {
      ...LOCAL_EXISTING_BASE,
      allowedEngines: OWNER_LOCAL_ENGINES,
    },
  },
} as const satisfies Record<
  CreateModelExecutionAudience,
  Record<CreateModelIdentityMode, GenerationModuleContract>
>;

function contractError(contract: GenerationModuleContract, detail: string): Error {
  return new Error(`El contrato de "${contract.name}" no coincide: ${detail}`);
}

export function assertGenerationModuleMatchesContract(
  module: GenerationModule,
  contract: GenerationModuleContract,
): void {
  if (module.id !== contract.moduleId) {
    throw contractError(contract, `se esperaba module_id=${contract.moduleId} y llegó ${module.id}.`);
  }
  if (module.key !== contract.key) {
    throw contractError(contract, `se esperaba key="${contract.key}" y llegó "${module.key}".`);
  }
  if (contract.version !== undefined && module.version !== contract.version) {
    throw contractError(contract, `se esperaba versión ${contract.version} y llegó ${module.version}.`);
  }
  if (
    contract.allowedEngines &&
    !contract.allowedEngines.includes(module.default_execution_engine)
  ) {
    throw contractError(
      contract,
      `el engine "${module.default_execution_engine}" no coincide con esta ruta. Esperado: ${contract.allowedEngines.join(" / ")}.`,
    );
  }

  for (const expected of contract.inputs) {
    const actual = module.inputs.find((input) => input.key === expected.key);
    if (!actual) {
      throw contractError(contract, `falta ${expected.key} (${expected.name}).`);
    }
    if (actual.input_type !== expected.type) {
      throw contractError(
        contract,
        `${expected.key} cambió de tipo: se esperaba ${expected.type} y llegó ${actual.input_type}.`,
      );
    }
    if (actual.is_required !== expected.required) {
      throw contractError(
        contract,
        `${expected.key} cambió obligatoriedad: se esperaba ${expected.required ? "obligatorio" : "opcional"}.`,
      );
    }
  }

  for (const expected of contract.outputs) {
    const actual = module.outputs.find((output) => output.key === expected.key);
    if (!actual) {
      throw contractError(contract, `falta ${expected.key} (${expected.name}).`);
    }
    if (actual.output_type !== expected.type) {
      throw contractError(
        contract,
        `${expected.key} cambió de tipo: se esperaba ${expected.type} y llegó ${actual.output_type}.`,
      );
    }
    if (actual.is_required !== expected.required) {
      throw contractError(
        contract,
        `${expected.key} cambió obligatoriedad: se esperaba ${expected.required ? "obligatorio" : "opcional"}.`,
      );
    }
  }
}

/**
 * The active local_docker publication is the switch for commercial-local.
 * Keeping modules 6/7 inactive (or not local_docker) preserves the historical
 * 4/5 path for ordinary users. Owner is always routed to 6/7; Backend then
 * forces owner_local independently of the module's published engine.
 */
export function createModelAudience(
  modules: readonly GenerationModule[],
  isOwner: boolean,
  identityMode: CreateModelIdentityMode,
): CreateModelExecutionAudience {
  if (isOwner) return "owner_local";

  const localContract = CREATE_MODEL_GENERATION_CONTRACTS.commercial_local[identityMode];
  const localModule = modules.find((item) => item.id === localContract.moduleId);

  if (
    localModule?.is_active &&
    localModule.default_execution_engine === "local_docker"
  ) {
    return "commercial_local";
  }

  return "commercial_remote";
}

export function createModelContract(
  modules: readonly GenerationModule[],
  isOwner: boolean,
  identityMode: CreateModelIdentityMode,
): GenerationModuleContract {
  return CREATE_MODEL_GENERATION_CONTRACTS[
    createModelAudience(modules, isOwner, identityMode)
  ][identityMode];
}

export function resolveCreateModelGenerationModule(
  modules: readonly GenerationModule[],
  {
    isOwner,
    identityMode,
    requireActive = true,
  }: {
    isOwner: boolean;
    identityMode: CreateModelIdentityMode;
    requireActive?: boolean;
  },
): GenerationModule {
  const audience = createModelAudience(modules, isOwner, identityMode);
  const contract = CREATE_MODEL_GENERATION_CONTRACTS[audience][identityMode];
  const module = modules.find((item) => item.id === contract.moduleId);

  if (!module || (requireActive && !module.is_active)) {
    throw new Error(
      `No se encontró activo "${contract.name}" (módulo ${contract.moduleId}) para la ruta ${audience}.`,
    );
  }

  // Fail closed when a local module is published for commercial use but its
  // contract drifted. We never silently send that request to another workflow.
  assertGenerationModuleMatchesContract(module, contract);
  return module;
}

export function tryResolveCreateModelGenerationModule(
  modules: readonly GenerationModule[],
  options: {
    isOwner: boolean;
    identityMode: CreateModelIdentityMode;
    requireActive?: boolean;
  },
): GenerationModule | null {
  try {
    return resolveCreateModelGenerationModule(modules, options);
  } catch {
    return null;
  }
}
