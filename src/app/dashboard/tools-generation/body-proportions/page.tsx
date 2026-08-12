"use client";

import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown, ChevronUp, FileJson, Image as ImageIcon, LoaderCircle, Play,
  Plus, RefreshCcw, Save, SlidersHorizontal, Trash2, Unplug, Images, X
} from "lucide-react";
import { toast } from "sonner";
import { browserApiRequest } from "@/lib/api/browser-api";
import type {
  AssLevel, BodyProportionConfig, BodyProportionGeneration, BodyProportionPreset,
  BodyProportionPresetList, BodyProportionResetResult, BodyProportionStorageOptions,
  BodySex, BreastLevel, FatLevel
} from "@/types/body-proportion-tools";

const API = "/api/admin/tools-generation/body-proportions";
const mapKeys = ["hips_size", "fat_thin", "breasts_size", "skin_tone", "hair_length", "category_name", "sex"] as const;

const defaults: BodyProportionConfig = {
  id: null,
  sex: "woman",
  workflow: null,
  input_mapping: {},
  limits: {
    hips_min: 0, hips_max: 9, breasts_min: null, breasts_max: 1.5,
    fat_thin_min: -1.5, fat_thin_max: 1.8, skin_tone_min: -5, skin_tone_max: 5
  },
  formula: {
    fat_levels: {
      very_low: { label: "Very Low Fat", body_fat_percent: 12, fat_thin: 1.6, hips_compensation: 0, breasts_compensation: 0, order: 10, is_core: true },
      low: { label: "Low Fat", body_fat_percent: 18, fat_thin: 1, hips_compensation: 0, breasts_compensation: 0, order: 20, is_core: true },
      medium_low: { label: "Medium-Low Fat", body_fat_percent: 24, fat_thin: 0.5, hips_compensation: 0, breasts_compensation: 0, order: 30, is_core: true },
      medium: { label: "Medium Fat", body_fat_percent: 30, fat_thin: 0, hips_compensation: 0, breasts_compensation: 0, order: 40, is_core: true },
      high: { label: "High Fat", body_fat_percent: 36, fat_thin: -0.5, hips_compensation: 0, breasts_compensation: 0, order: 50, is_core: true },
      very_high: { label: "Very High Fat", body_fat_percent: 42, fat_thin: -1, hips_compensation: 0, breasts_compensation: 0, order: 60, is_core: true },
    },
    ass_levels: {
      small: { label: "Small Ass", hips_size: 0, order: 10, is_core: true },
      medium: { label: "Medium Ass", hips_size: 3, order: 20, is_core: true },
      big: { label: "Big Ass", hips_size: 6, order: 30, is_core: true },
      huge: { label: "Huge Ass", hips_size: 7, order: 40, is_core: true },
    },
    breast_levels: {
      small: { label: "Small Breast", base: 0, order: 10, is_core: true },
      medium: { label: "Medium Breast", base: 0.5, order: 20, is_core: true },
      big: { label: "Big Breast", base: 1, order: 30, is_core: true },
      huge: { label: "Huge Breast", base: 1.5, order: 40, is_core: true },
    },
    ass_breast_compensation: {
      small: { small: 0, medium: 0, big: 0, huge: 0 },
      medium: { small: 0, medium: -0.2, big: -0.2, huge: -0.2 },
      big: { small: -0.2, medium: -0.4, big: -0.4, huge: -0.4 },
      huge: { small: -0.2, medium: -0.4, big: -0.4, huge: -0.4 },
    },
  },
  fixed_values: { skin_tone: 3, hair_length: 3.5 },
  storage_mode: "auto",
  is_enabled: false,
  notes: null,
  created_at: null,
  updated_at: null,
};

const ordered = <T extends { order: number }>(levels: Record<string, T>) =>
  Object.entries(levels).sort((a, b) => a[1].order - b[1].order);

const num = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export default function BodyProportionGeneratorPage() {
  const [sex, setSex] = useState<BodySex>("woman");
  const [config, setConfig] = useState<BodyProportionConfig>(defaults);
  const [presets, setPresets] = useState<BodyProportionPreset[]>([]);
  const [storage, setStorage] = useState<BodyProportionStorageOptions>({
    active_provider: "local", modes: ["auto", "local", "amazon_s3", "cloudflare_r2"]
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [dangerOpen, setDangerOpen] = useState(false);
  const [deleteWorkflowMappingsOnReset, setDeleteWorkflowMappingsOnReset] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false); // CLOSED BY DEFAULT
  const [nodeIdSearch, setNodeIdSearch] = useState<Record<string, string>>({});
  const [matrixOpen, setMatrixOpen] = useState<Record<string, boolean>>({ low: true });
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Presentation only: backend keys, formula fields and persisted category names remain "ass".
  const visualLabel = (value: string) => value.replace(/\bAss\b/gi, match => match[0] === "A" ? "Hips" : "hips");
  const internalAssLabel = (value: string) => value.replace(/\bHips\b/gi, match => match[0] === "H" ? "Ass" : "ass");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, list, storageOptions] = await Promise.all([
        browserApiRequest<BodyProportionConfig>(`${API}/config/${sex}`),
        browserApiRequest<BodyProportionPresetList>(`${API}/presets?sex=${sex}`),
        browserApiRequest<BodyProportionStorageOptions>(`${API}/storage-options`),
      ]);
      setConfig(cfg);
      setPresets(list.items);
      setStorage(storageOptions);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la herramienta.");
    } finally {
      setLoading(false);
    }
  }, [sex]);

  useEffect(() => { void load(); }, [load]);

  const fatEntries = useMemo(() => ordered(config.formula.fat_levels), [config.formula.fat_levels]);
  const assEntries = useMemo(() => ordered(config.formula.ass_levels), [config.formula.ass_levels]);
  const breastEntries = useMemo(() => ordered(config.formula.breast_levels), [config.formula.breast_levels]);

  const workflowNodes = useMemo(() => Object.entries(config.workflow ?? {}).map(([id, raw]) => {
    const node = raw as { class_type?: string; _meta?: { title?: string }; inputs?: Record<string, unknown> };
    return { id, label: `${id} · ${node._meta?.title ?? node.class_type ?? "Node"}`, inputs: Object.keys(node.inputs ?? {}) };
  }), [config.workflow]);

  const saveConfigValue = async (next: BodyProportionConfig, syncMatrix = false) => {
    const saved = await browserApiRequest<BodyProportionConfig>(`${API}/config/${sex}`, {
      method: "PUT",
      body: JSON.stringify({
        workflow: next.workflow,
        input_mapping: next.input_mapping,
        limits: next.limits,
        formula: next.formula,
        fixed_values: next.fixed_values,
        storage_mode: next.storage_mode,
        is_enabled: next.is_enabled,
        notes: next.notes,
      }),
    });
    setConfig(saved);
    if (syncMatrix && sex === "woman") {
      await browserApiRequest(`${API}/presets/seed-defaults?sex=${sex}`, { method: "POST" });
      await browserApiRequest(`${API}/presets/recalculate-defaults?sex=${sex}`, {
        method: "POST", body: JSON.stringify({ include_ready: false })
      });
      const list = await browserApiRequest<BodyProportionPresetList>(`${API}/presets?sex=${sex}`);
      setPresets(list.items);
    }
    return saved;
  };

  const saveConfig = async () => {
    try {
      await saveConfigValue(config, true);
      toast.success("Configuración guardada y malla sincronizada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  };

  const uploadWorkflow = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const workflow = JSON.parse(text);
      setConfig(c => ({ ...c, workflow }));
      toast.success(`Workflow cargado: ${file.name}`);
    } catch {
      toast.error("El JSON del workflow no es válido.");
    } finally {
      event.target.value = "";
    }
  };

  const syncMatrix = async () => {
    try {
      const r = await browserApiRequest<{ created: number; existing: number; removed: number; total_base: number }>(
        `${API}/presets/seed-defaults?sex=${sex}`, { method: "POST" }
      );
      await load();
      toast.success(`${r.total_base} categorías base · ${r.created} nuevas · ${r.removed ?? 0} obsoletas eliminadas.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo sincronizar la malla.");
    }
  };

  const recalc = async () => {
    try {
      const r = await browserApiRequest<{ updated: number; skipped_ready: number }>(
        `${API}/presets/recalculate-defaults?sex=${sex}`,
        { method: "POST", body: JSON.stringify({ include_ready: false }) }
      );
      await load();
      toast.success(`${r.updated} pendientes recalculados; ${r.skipped_ready} generados preservados.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo recalcular.");
    }
  };

  const savePreset = async (p: BodyProportionPreset) => {
    const saved = await browserApiRequest<BodyProportionPreset>(`${API}/presets/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        display_name: p.display_name, hips_size: p.hips_size, fat_thin: p.fat_thin,
        breasts_size: p.breasts_size, skin_tone: p.skin_tone, hair_length: p.hair_length
      }),
    });
    setPresets(list => list.map(x => x.id === saved.id ? saved : x));
    return saved;
  };

  const restorePresetValues = async (p: BodyProportionPreset) => {
    try {
      const restored = await browserApiRequest<BodyProportionPreset>(
        `${API}/presets/${p.id}/synchronize-rules`,
        { method: "POST" }
      );
      setPresets(list => list.map(item => item.id === restored.id ? restored : item));
      toast.success("Valores restaurados según la configuración global.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron restaurar los valores.");
    }
  };

  const generate = async (p: BodyProportionPreset) => {
    setGenerating(s => new Set(s).add(p.id));
    try {
      await savePreset(p);
      const r = await browserApiRequest<BodyProportionGeneration>(`${API}/presets/${p.id}/generate`, { method: "POST" });
      setPresets(list => list.map(x => x.id === p.id ? r.preset : x));
      toast.success(`${p.display_name}${r.overwritten ? " regenerado" : " generado"}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falló la generación.");
    } finally {
      setGenerating(s => {
        const next = new Set(s); next.delete(p.id); return next;
      });
    }
  };

  const generateList = async (rows: BodyProportionPreset[]) => {
    for (const row of rows) await generate(row);
  };

  const patchPreset = (id: number, change: Partial<BodyProportionPreset>) =>
    setPresets(list => list.map(x => x.id === id ? { ...x, ...change } : x));

  const patchMapping = (key: string, field: "node_id" | "input_name", value: string) =>
    setConfig(c => ({
      ...c,
      input_mapping: {
        ...c.input_mapping,
        [key]: {
          node_id: c.input_mapping[key]?.node_id ?? "",
          input_name: c.input_mapping[key]?.input_name ?? "",
          [field]: value,
        },
      },
    }));

  const applyAnchorConfig = async (next: BodyProportionConfig, message: string) => {
    try {
      setConfig(next);
      await saveConfigValue(next, true);
      toast.success(message);
    } catch (e) {
      await load();
      toast.error(e instanceof Error ? e.message : "No se pudo aplicar el ancla.");
    }
  };

  const insertAssBetween = async (leftKey: string, rightKey: string) => {
    const left = config.formula.ass_levels[leftKey], right = config.formula.ass_levels[rightKey];
    const key = uid("ass");
    const hips = (left.hips_size + right.hips_size) / 2;
    const level: AssLevel = { label: `Intermediate Ass ${hips.toFixed(2)}`, hips_size: hips, order: (left.order + right.order) / 2, is_core: false };
    const compensation = { ...config.formula.ass_breast_compensation };
    compensation[key] = {};
    for (const [breastKey] of breastEntries) {
      compensation[key][breastKey] =
        ((compensation[leftKey]?.[breastKey] ?? 0) + (compensation[rightKey]?.[breastKey] ?? 0)) / 2;
    }
    const next: BodyProportionConfig = {
      ...config,
      formula: {
        ...config.formula,
        ass_levels: { ...config.formula.ass_levels, [key]: level },
        ass_breast_compensation: compensation,
      },
    };
    await applyAnchorConfig(next, `Intermedio de hips creado en ${hips.toFixed(2)}.`);
  };

  const insertBreastBetween = async (leftKey: string, rightKey: string) => {
    const left = config.formula.breast_levels[leftKey], right = config.formula.breast_levels[rightKey];
    const key = uid("breast");
    const base = (left.base + right.base) / 2;
    const level: BreastLevel = { label: `Intermediate Breast ${base.toFixed(2)}`, base, order: (left.order + right.order) / 2, is_core: false };
    const compensation: Record<string, Record<string, number>> = {};
    for (const [assKey] of assEntries) {
      const row = { ...(config.formula.ass_breast_compensation[assKey] ?? {}) };
      row[key] = ((row[leftKey] ?? 0) + (row[rightKey] ?? 0)) / 2;
      compensation[assKey] = row;
    }
    const next: BodyProportionConfig = {
      ...config,
      formula: {
        ...config.formula,
        breast_levels: { ...config.formula.breast_levels, [key]: level },
        ass_breast_compensation: compensation,
      },
    };
    await applyAnchorConfig(next, `Intermedio de pecho creado en ${base.toFixed(2)}.`);
  };

  const insertFatBetween = async (leftKey: string, rightKey: string) => {
    const left = config.formula.fat_levels[leftKey], right = config.formula.fat_levels[rightKey];
    const key = uid("fat");
    const level: FatLevel = {
      label: "Intermediate Fat",
      body_fat_percent: (left.body_fat_percent + right.body_fat_percent) / 2,
      fat_thin: (left.fat_thin + right.fat_thin) / 2,
      hips_compensation: (left.hips_compensation + right.hips_compensation) / 2,
      breasts_compensation: (left.breasts_compensation + right.breasts_compensation) / 2,
      order: (left.order + right.order) / 2,
      is_core: false,
    };
    level.label = `${level.body_fat_percent.toFixed(0)}% Body Fat`;
    const next: BodyProportionConfig = {
      ...config,
      formula: { ...config.formula, fat_levels: { ...config.formula.fat_levels, [key]: level } },
    };
    await applyAnchorConfig(next, `Banda intermedia de grasa creada en ${level.body_fat_percent.toFixed(1)}%.`);
  };

  const removeAnchor = async (kind: "ass" | "breast" | "fat", key: string) => {
    if (!window.confirm("Se eliminará esta ancla intermedia y todas las categorías derivadas de ella, incluidas sus imágenes. ¿Continuar?")) return;
    const formula = structuredClone(config.formula);
    if (kind === "ass") {
      delete formula.ass_levels[key];
      delete formula.ass_breast_compensation[key];
    } else if (kind === "breast") {
      delete formula.breast_levels[key];
      for (const assKey of Object.keys(formula.ass_breast_compensation)) {
        delete formula.ass_breast_compensation[assKey][key];
      }
    } else {
      delete formula.fat_levels[key];
    }
    await applyAnchorConfig({ ...config, formula }, "Ancla intermedia eliminada.");
  };

  const resetAll = async () => {
    if (!window.confirm(`Esto eliminará TODOS los presets, imágenes e intermedios de ${sex === "woman" ? "Mujer" : "Hombre"} de esta herramienta.${deleteWorkflowMappingsOnReset ? " También eliminará el workflow y los nodos mapeados." : " El workflow y los nodos mapeados se conservarán."} No afecta ningún otro módulo. ¿Continuar?`)) return;
    if (!window.confirm("Confirmación final: esta acción no se puede deshacer. ¿Limpiar todo?")) return;
    try {
      const r = await browserApiRequest<BodyProportionResetResult>(
        `${API}/reset/${sex}?delete_workflow_mappings=${deleteWorkflowMappingsOnReset ? "true" : "false"}`,
        { method: "DELETE" }
      );
      toast.success(`Limpieza terminada: ${r.deleted_presets} presets eliminados.`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo limpiar la herramienta.");
    }
  };

  const base = presets.filter(p => p.is_base_category);

  if (loading) {
    return <div className="flex min-h-[520px] items-center justify-center"><LoaderCircle className="animate-spin text-red-500" /></div>;
  }

  return <div className="space-y-5 pb-16">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.28em] text-red-400">Tools Generation</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Generador de proporciones corporales</h1>
        <p className="mt-2 max-w-5xl text-sm text-zinc-500">
          Malla dinámica derivada de bandas de grasa, anclas de hips y anclas de pecho.
          Los intermedios amplían automáticamente la matriz sin tocar el resto de la plataforma.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={syncMatrix} className="bp-secondary"><RefreshCcw size={15}/>Sincronizar malla</button>
        <button onClick={recalc} className="bp-secondary"><SlidersHorizontal size={15}/>Recalcular pendientes</button>
        <button onClick={() => setGalleryOpen(true)} className="bp-secondary"><Images size={15}/>Galería comparativa</button>
        <button onClick={() => generateList(base.filter(x => x.status !== "ready"))} disabled={generating.size > 0} className="bp-primary">
          <Play size={15}/>Generar pendientes
        </button>
      </div>
    </header>

    <div className="flex w-fit gap-2 rounded-2xl border border-white/7 bg-black/20 p-1.5">
      {(["woman", "man"] as BodySex[]).map(v =>
        <button key={v} onClick={() => setSex(v)} className={`rounded-xl px-5 py-2 text-sm font-semibold ${sex === v ? "bg-red-600 text-white" : "text-zinc-500 hover:text-white"}`}>
          {v === "woman" ? "Mujer" : "Hombre"}
        </button>
      )}
    </div>

    <Accordion title="Workflow y almacenamiento" subtitle="ComfyUI local + destino de archivos. Auto respeta la configuración global." defaultOpen>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-white/7 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Workflow API de ComfyUI</p>
          <p className="mt-1 text-xs text-zinc-600">{config.workflow ? `${Object.keys(config.workflow).length} nodos cargados` : "Sin workflow cargado"}</p>
          <label className="bp-secondary mt-4 cursor-pointer">
            <FileJson size={15}/>Cargar workflow API JSON
            <input type="file" accept=".json,application/json" onChange={uploadWorkflow} className="hidden"/>
          </label>
        </div>
        <div className="rounded-2xl border border-white/7 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Almacenamiento de esta herramienta</p>
          <p className="mt-1 text-xs text-zinc-600">Proveedor global activo: <b className="text-zinc-300">{storage.active_provider}</b></p>
          <select value={config.storage_mode} onChange={e => setConfig(c => ({ ...c, storage_mode: e.target.value as BodyProportionConfig["storage_mode"] }))} className="bp-input mt-4">
            <option value="auto">Auto · usar configuración global</option>
            <option value="local">Local</option>
            <option value="amazon_s3">Amazon S3</option>
            <option value="cloudflare_r2">Cloudflare R2</option>
          </select>
          <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={config.is_enabled} onChange={e => setConfig(c => ({ ...c, is_enabled: e.target.checked }))}/>
            Habilitar generación con este workflow
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end"><button onClick={saveConfig} className="bp-primary"><Save size={15}/>Guardar</button></div>
    </Accordion>

    <Accordion title="Valores fijos y límites" subtitle="Skin tone y hair length permanecen fijos por ahora; límites protegen la fórmula.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Skin tone fijo" value={config.fixed_values.skin_tone ?? 0} min={-5} max={5}
          onChange={v => setConfig(c => ({ ...c, fixed_values: { ...c.fixed_values, skin_tone: v } }))}/>
        <Field label="Hair length fijo" value={config.fixed_values.hair_length ?? 0}
          onChange={v => setConfig(c => ({ ...c, fixed_values: { ...c.fixed_values, hair_length: v } }))}/>
        <Field label="Hips máximo" value={config.limits.hips_max ?? 9} min={0} max={9}
          onChange={v => setConfig(c => ({ ...c, limits: { ...c.limits, hips_max: v } }))}/>
        <Field label="Breasts máximo" value={config.limits.breasts_max ?? 1.5} max={1.5}
          onChange={v => setConfig(c => ({ ...c, limits: { ...c.limits, breasts_max: v } }))}/>
      </div>
      <div className="mt-4 flex justify-end"><button onClick={saveConfig} className="bp-primary"><Save size={15}/>Guardar</button></div>
    </Accordion>

    <Accordion title="Bandas de grasa corporal" subtitle={`${fatEntries.length} niveles. Puedes insertar bandas entre dos existentes.`}>
      <div className="space-y-2">
        {fatEntries.map(([key, level], index) => {
          const prev = fatEntries[index - 1]?.[1];
          const next = fatEntries[index + 1]?.[1];
          return <div key={key}>
            <AnchorRow
              label={level.label}
              onLabel={v => setConfig(c => ({ ...c, formula: { ...c.formula, fat_levels: { ...c.formula.fat_levels, [key]: { ...c.formula.fat_levels[key], label: v } } } }))}
              fields={[
                { label: "% grasa", value: level.body_fat_percent, min: prev ? prev.body_fat_percent + .01 : 0, max: next ? next.body_fat_percent - .01 : 100,
                  onChange: v => setConfig(c => ({ ...c, formula: { ...c.formula, fat_levels: { ...c.formula.fat_levels, [key]: { ...c.formula.fat_levels[key], body_fat_percent: v } } } })) },
                { label: "fat_thin", value: level.fat_thin, min: next ? next.fat_thin + .001 : (config.limits.fat_thin_min ?? -1.5), max: prev ? prev.fat_thin - .001 : (config.limits.fat_thin_max ?? 1.8),
                  onChange: v => setConfig(c => ({ ...c, formula: { ...c.formula, fat_levels: { ...c.formula.fat_levels, [key]: { ...c.formula.fat_levels[key], fat_thin: v } } } })) },
                { label: "Comp. Hips", value: level.hips_compensation,
                  onChange: v => setConfig(c => ({ ...c, formula: { ...c.formula, fat_levels: { ...c.formula.fat_levels, [key]: { ...c.formula.fat_levels[key], hips_compensation: v } } } })) },
                { label: "Comp. Breast", value: level.breasts_compensation,
                  onChange: v => setConfig(c => ({ ...c, formula: { ...c.formula, fat_levels: { ...c.formula.fat_levels, [key]: { ...c.formula.fat_levels[key], breasts_compensation: v } } } })) },
              ]}
              canDelete={!level.is_core}
              onDelete={() => removeAnchor("fat", key)}
            />
            {index < fatEntries.length - 1 &&
              <BetweenButton onClick={() => insertFatBetween(key, fatEntries[index + 1][0])} text="Agregar nivel de grasa intermedio"/>
            }
          </div>;
        })}
      </div>
      <div className="mt-4 flex justify-end"><button onClick={saveConfig} className="bp-primary"><Save size={15}/>Guardar y sincronizar</button></div>
    </Accordion>

    <Accordion title="Anclas de hips" subtitle={`${assEntries.length} anclas. Cada intermedio queda obligado a permanecer entre sus vecinos.`}>
      <div className="space-y-2">
        {assEntries.map(([key, level], index) => {
          const prev = assEntries[index - 1]?.[1];
          const next = assEntries[index + 1]?.[1];
          return <div key={key}>
            <AnchorRow
              label={visualLabel(level.label)}
              onLabel={v => setConfig(c => ({ ...c, formula: { ...c.formula, ass_levels: { ...c.formula.ass_levels, [key]: { ...c.formula.ass_levels[key], label: internalAssLabel(v) } } } }))}
              fields={[{
                label: "hips_size", value: level.hips_size,
                min: prev ? prev.hips_size + .001 : (config.limits.hips_min ?? 0),
                max: next ? next.hips_size - .001 : (config.limits.hips_max ?? 9),
                onChange: v => setConfig(c => ({ ...c, formula: { ...c.formula, ass_levels: { ...c.formula.ass_levels, [key]: { ...c.formula.ass_levels[key], hips_size: v } } } })),
              }]}
              canDelete={!level.is_core}
              onDelete={() => removeAnchor("ass", key)}
            />
            {index < assEntries.length - 1 &&
              <BetweenButton onClick={() => insertAssBetween(key, assEntries[index + 1][0])} text="Agregar hips intermedio"/>
            }
          </div>;
        })}
      </div>
      <div className="mt-4 flex justify-end"><button onClick={saveConfig} className="bp-primary"><Save size={15}/>Guardar y sincronizar</button></div>
    </Accordion>

    <Accordion title="Anclas de pecho" subtitle={`${breastEntries.length} anclas. Puedes crear tantos puntos intermedios como necesites.`}>
      <div className="space-y-2">
        {breastEntries.map(([key, level], index) => {
          const prev = breastEntries[index - 1]?.[1];
          const next = breastEntries[index + 1]?.[1];
          return <div key={key}>
            <AnchorRow
              label={level.label}
              onLabel={v => setConfig(c => ({ ...c, formula: { ...c.formula, breast_levels: { ...c.formula.breast_levels, [key]: { ...c.formula.breast_levels[key], label: v } } } }))}
              fields={[{
                label: "breasts_size", value: level.base,
                min: prev ? prev.base + .001 : (config.limits.breasts_min ?? -10),
                max: next ? next.base - .001 : (config.limits.breasts_max ?? 1.5),
                onChange: v => setConfig(c => ({ ...c, formula: { ...c.formula, breast_levels: { ...c.formula.breast_levels, [key]: { ...c.formula.breast_levels[key], base: v } } } })),
              }]}
              canDelete={!level.is_core}
              onDelete={() => removeAnchor("breast", key)}
            />
            {index < breastEntries.length - 1 &&
              <BetweenButton onClick={() => insertBreastBetween(key, breastEntries[index + 1][0])} text="Agregar pecho intermedio"/>
            }
          </div>;
        })}
      </div>
      <div className="mt-4 flex justify-end"><button onClick={saveConfig} className="bp-primary"><Save size={15}/>Guardar y sincronizar</button></div>
    </Accordion>

    <Accordion title="Compensación hips → pecho" subtitle="Matriz avanzada. Los intermedios heredan por interpolación la compensación de sus vecinos.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead><tr>
            <th className="p-2 text-left text-zinc-600">Hips \\ Breast</th>
            {breastEntries.map(([b, level]) => <th key={b} className="p-2 text-zinc-600">{level.label}</th>)}
          </tr></thead>
          <tbody>
            {assEntries.map(([a, ass]) => <tr key={a}>
              <td className="p-2 text-zinc-400">{visualLabel(ass.label)}</td>
              {breastEntries.map(([b]) => <td key={b} className="p-1">
                <input type="number" step="0.05" value={config.formula.ass_breast_compensation[a]?.[b] ?? 0}
                  onChange={e => setConfig(c => ({
                    ...c, formula: {
                      ...c.formula,
                      ass_breast_compensation: {
                        ...c.formula.ass_breast_compensation,
                        [a]: { ...(c.formula.ass_breast_compensation[a] ?? {}), [b]: num(e.target.value) }
                      }
                    }
                  }))} className="bp-input"/>
              </td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={saveConfig} className="bp-primary"><Save size={15}/>Guardar</button>
        <button onClick={recalc} className="bp-secondary"><RefreshCcw size={15}/>Aplicar a pendientes</button>
      </div>
    </Accordion>

    <section className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[.22em] text-red-400">Perfiles de {sex === "woman" ? "mujer" : "hombre"}</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Malla visual · {base.length} categorías</h2>
      </div>
      {sex === "woman" && base.length === 0 &&
        <div className="luxia-panel rounded-3xl p-10 text-center">
          <p className="text-sm font-semibold text-white">La malla está vacía.</p>
          <p className="mt-2 text-xs text-zinc-600">Crea las categorías derivadas de tus bandas y anclas actuales.</p>
          <button onClick={syncMatrix} className="bp-primary mt-4"><Plus size={15}/>Crear malla base</button>
        </div>
      }
      {sex === "man" && base.length === 0
        ? <div className="luxia-panel rounded-3xl p-10 text-center text-sm text-zinc-500">Interfaz preparada. La malla de hombre se habilitará cuando cargues y calibres su workflow.</div>
        : fatEntries.map(([fatKey, fat]) => {
            const rows = base.filter(p => p.fat_band === fatKey);
            const isOpen = !!matrixOpen[fatKey];
            return <div key={fatKey} className="luxia-panel overflow-hidden rounded-3xl">
              <button onClick={() => setMatrixOpen(o => ({ ...o, [fatKey]: !o[fatKey] }))} className="flex w-full items-center justify-between p-5 text-left">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-red-400">{fat.label} · {fat.body_fat_percent}% Body Fat</p>
                  <p className="mt-1 text-sm text-zinc-500">{rows.length} categorías · fat_thin {fat.fat_thin}</p>
                </div>
                {isOpen ? <ChevronUp/> : <ChevronDown/>}
              </button>
              {isOpen && <div className="space-y-5 border-t border-white/6 p-5">
                <div className="flex justify-end gap-2">
                  <button onClick={() => generateList(rows.filter(x => x.status === "draft"))} className="bp-secondary">Generar pendientes del grupo</button>
                  <button onClick={() => generateList(rows)} className="bp-secondary">Regenerar grupo</button>
                </div>
                {assEntries.map(([assKey, ass]) => {
                  const assRows = rows.filter(p => p.ass_band === assKey);
                  return <Accordion key={assKey} title={visualLabel(ass.label)} subtitle={`${assRows.length} combinaciones de pecho`} compact>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {breastEntries.map(([breastKey, breast]) => {
                        const p = assRows.find(x => x.breast_band === breastKey);
                        return p
                          ? <PresetCard key={p.id} preset={p} displayName={visualLabel(p.display_name)} busy={generating.has(p.id)}
                              patch={v => patchPreset(p.id, v)}
                              save={() => savePreset(p).then(() => toast.success("Preset guardado."))}
                              restoreValues={() => restorePresetValues(p)}
                              generate={() => generate(p)}/>
                          : <div key={breastKey} className="rounded-2xl border border-white/6 p-4 text-xs text-zinc-700">Falta {breast.label}</div>;
                      })}
                    </div>
                  </Accordion>;
                })}
              </div>}
            </div>;
          })
      }
    </section>

    {galleryOpen && <div className="fixed inset-0 z-[100] bg-black/90 p-4 backdrop-blur-sm md:p-8">
      <div className="mx-auto flex h-full max-w-[1800px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div><p className="text-xs uppercase tracking-[.22em] text-red-400">Comparación visual</p><h2 className="text-lg font-semibold text-white">Todas las previsualizaciones · {presets.filter(p => p.image_storage_file_id).length}</h2></div>
          <button onClick={() => setGalleryOpen(false)} className="bp-secondary"><X size={16}/>Cerrar</button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="grid grid-cols-3 gap-[3px] sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
            {presets.filter(p => p.image_storage_file_id).map(p => <div key={p.id} className="group relative overflow-hidden bg-black">
              <img src={`/api/admin/storage/files/${p.image_storage_file_id}/content`} alt={visualLabel(p.display_name)} className="aspect-[4/5] h-auto w-full object-cover"/>
              <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-[9px] leading-3 text-white">{visualLabel(p.display_name)}</p>
                <p className="mt-0.5 font-mono text-[8px] text-zinc-400">H {p.hips_size} · F {p.fat_thin} · B {p.breasts_size}</p>
              </div>
            </div>)}
          </div>
          {presets.every(p => !p.image_storage_file_id) && <div className="flex h-full items-center justify-center text-sm text-zinc-600">Todavía no hay previsualizaciones generadas.</div>}
        </div>
      </div>
    </div>}

    <Accordion title="Vincular nodos e inputs del workflow" subtitle="Avanzado · permanece cerrado por defecto. Relaciona cada valor con node_id + input_name." forceOpen={mappingOpen} onForceOpen={setMappingOpen}>
      {!config.workflow
        ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-600">Carga primero un workflow API JSON.</div>
        : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mapKeys.map(key => {
              const m = config.input_mapping[key];
              const node = workflowNodes.find(n => n.id === m?.node_id);
              return <div key={key} className="rounded-xl border border-white/6 p-3">
                <p className="mb-2 text-xs font-medium text-zinc-300">{key}</p>
                <input
                  value={nodeIdSearch[key] ?? ""}
                  onChange={e => setNodeIdSearch(prev => ({ ...prev, [key]: e.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder="Buscar ID de nodo..."
                  inputMode="numeric"
                  className="bp-input mb-2"
                />
                <select value={m?.node_id ?? ""} onChange={e => patchMapping(key, "node_id", e.target.value)} className="bp-input">
                  <option value="">Sin mapear</option>
                  {workflowNodes
                    .filter(n => {
                      const q = (nodeIdSearch[key] ?? "").trim();
                      return !q || n.id.includes(q) || n.id === m?.node_id;
                    })
                    .map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <select value={m?.input_name ?? ""} onChange={e => patchMapping(key, "input_name", e.target.value)} className="bp-input mt-2">
                  <option value="">Input</option>
                  {(node?.inputs ?? []).map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>;
            })}
          </div>
      }
      <div className="mt-4 flex justify-end"><button onClick={saveConfig} className="bp-primary"><Unplug size={15}/>Guardar vínculos</button></div>
    </Accordion>

    <section className="overflow-hidden rounded-3xl border border-red-500/15 bg-red-950/10">
      <button onClick={() => setDangerOpen(v => !v)} className="flex w-full items-center justify-between p-5">
        <div className="text-left">
          <h2 className="font-semibold text-red-300">Zona de reinicio</h2>
          <p className="text-xs text-red-300/45">Afecta únicamente esta herramienta y el sexo seleccionado.</p>
        </div>
        {dangerOpen ? <ChevronUp/> : <ChevronDown/>}
      </button>
      {dangerOpen && <div className="border-t border-red-500/10 p-5">
        <p className="max-w-3xl text-xs leading-5 text-zinc-500">
          Elimina presets, intermedios, previews, archivos vinculados por esta herramienta y espejo local.
          Las reglas vuelven a sus valores predeterminados. El workflow y los nodos mapeados se conservan salvo que marques la opción siguiente.
          No modifica usuarios, billing, generación comercial, Modal, RunPod, Beam, Storage global ni ningún otro módulo.
        </p>
        <label className="mt-4 flex max-w-xl cursor-pointer items-start gap-3 rounded-xl border border-red-500/15 bg-red-950/15 p-3">
          <input
            type="checkbox"
            checked={deleteWorkflowMappingsOnReset}
            onChange={e => setDeleteWorkflowMappingsOnReset(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-red-600"
          />
          <span className="text-xs leading-5 text-red-200/80">
            Eliminar también el workflow de ComfyUI y todos los nodos/inputs mapeados.
          </span>
        </label>
        <button onClick={resetAll} className="mt-4 inline-flex h-42 items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs font-semibold text-red-300 hover:bg-red-950/60">
          <Trash2 size={15}/>Limpiar TODO · {sex === "woman" ? "Mujer" : "Hombre"}
        </button>
      </div>}
    </section>

    <style jsx global>{`
      .bp-primary{display:inline-flex;height:42px;align-items:center;justify-content:center;gap:8px;border-radius:12px;background:#dc2626;padding:0 16px;font-size:13px;font-weight:600;color:white}
      .bp-primary:hover{background:#ef4444}.bp-primary:disabled{opacity:.45}
      .bp-secondary{display:inline-flex;height:42px;align-items:center;justify-content:center;gap:8px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.25);padding:0 14px;font-size:12px;font-weight:600;color:#d4d4d8}
      .bp-secondary:hover{border-color:rgba(239,68,68,.3);color:white}
      .bp-input{height:38px;width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:#09090b;padding:0 10px;font-size:12px;color:#e4e4e7;outline:none}
      .bp-input:focus{border-color:rgba(239,68,68,.45)}
    `}</style>
  </div>;
}

function Accordion({
  title, subtitle, children, defaultOpen = false, compact = false, forceOpen, onForceOpen,
}: {
  title: string; subtitle?: string; children: ReactNode; defaultOpen?: boolean; compact?: boolean;
  forceOpen?: boolean; onForceOpen?: (v: boolean) => void;
}) {
  const [internal, setInternal] = useState(defaultOpen);
  const controlled = typeof forceOpen === "boolean";
  const open = controlled ? forceOpen : internal;
  const toggle = () => controlled ? onForceOpen?.(!open) : setInternal(v => !v);
  return <div className={`luxia-panel overflow-hidden ${compact ? "rounded-2xl" : "rounded-3xl"}`}>
    <button onClick={toggle} className={`flex w-full items-center justify-between text-left ${compact ? "p-4" : "p-5"}`}>
      <div><h2 className={`${compact ? "text-sm" : ""} font-semibold text-white`}>{title}</h2>{subtitle && <p className="mt-1 text-xs text-zinc-600">{subtitle}</p>}</div>
      {open ? <ChevronUp size={compact ? 17 : 20}/> : <ChevronDown size={compact ? 17 : 20}/>}
    </button>
    {open && <div className={`border-t border-white/6 ${compact ? "p-4" : "p-5"}`}>{children}</div>}
  </div>;
}

function BetweenButton({ onClick, text }: { onClick: () => void; text: string }) {
  return <div className="flex items-center gap-3 py-2">
    <div className="h-px flex-1 bg-white/5"/>
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full border border-red-500/15 bg-red-950/10 px-3 py-1.5 text-[10px] font-semibold text-red-300 hover:border-red-500/35">
      <Plus size={12}/>{text}
    </button>
    <div className="h-px flex-1 bg-white/5"/>
  </div>;
}

function AnchorRow({
  label, onLabel, fields, canDelete, onDelete,
}: {
  label: string;
  onLabel: (v: string) => void;
  fields: Array<{ label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }>;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return <div className="grid gap-3 rounded-2xl border border-white/7 bg-black/20 p-3 xl:grid-cols-[1.2fr_3fr_auto] xl:items-end">
    <label><span className="mb-1 block text-[9px] uppercase tracking-[.12em] text-zinc-600">Nombre</span>
      <input value={label} onChange={e => onLabel(e.target.value)} className="bp-input"/>
    </label>
    <div className={`grid gap-2 ${fields.length >= 4 ? "md:grid-cols-4" : fields.length === 1 ? "grid-cols-1" : "md:grid-cols-2"}`}>
      {fields.map(f => <Field key={f.label} {...f}/>)}
    </div>
    <button onClick={onDelete} disabled={!canDelete} title={canDelete ? "Eliminar intermedio" : "Ancla principal protegida"}
      className="inline-flex h-[38px] items-center justify-center rounded-xl border border-white/7 px-3 text-zinc-600 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-25">
      <Trash2 size={14}/>
    </button>
  </div>;
}

function Field({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const normalized = draft.trim().replace(",", ".");

    // Estados válidos mientras el usuario todavía está escribiendo un decimal negativo.
    if (normalized === "" || normalized === "-" || normalized === "." || normalized === "-.") {
      setDraft(String(value));
      return;
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }

    const bounded = Math.min(max ?? parsed, Math.max(min ?? parsed, parsed));
    onChange(bounded);
    setDraft(String(bounded));
  };

  return <label>
    <span className="mb-1 block text-[9px] uppercase tracking-[.12em] text-zinc-600">{label}</span>
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={e => {
        const next = e.target.value;
        if (/^-?\d*(?:[.,]\d*)?$/.test(next)) setDraft(next);
      }}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          setDraft(String(value));
          e.currentTarget.blur();
        }
      }}
      className="bp-input"
    />
    {(min !== undefined || max !== undefined) && <span className="mt-1 block text-[8px] text-zinc-700">{min !== undefined ? `≥${Number(min).toFixed(3)}` : ""}{min !== undefined && max !== undefined ? " · " : ""}{max !== undefined ? `≤${Number(max).toFixed(3)}` : ""}</span>}
  </label>;
}

function PresetCard({ preset, displayName, busy, patch, save, restoreValues, generate }: {
  preset: BodyProportionPreset; displayName: string; busy: boolean; patch: (v: Partial<BodyProportionPreset>) => void; save: () => void; restoreValues: () => void; generate: () => void;
}) {
  const img = preset.image_storage_file_id ? `/api/admin/storage/files/${preset.image_storage_file_id}/content` : null;
  return <div className="overflow-hidden rounded-2xl border border-white/6 bg-black/20">
    <div className="relative aspect-[4/5] bg-black/40">
      {img ? <img src={img} alt={displayName} className="h-full w-full object-cover"/>
        : <div className="flex h-full flex-col items-center justify-center text-zinc-800"><ImageIcon/><span className="mt-2 text-[10px]">Sin preview</span></div>}
      {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><LoaderCircle className="animate-spin text-red-400"/></div>}
      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 font-mono text-[9px] text-red-300">{preset.profile_key}</span>
    </div>
    <div className="space-y-3 p-3">
      <p className="min-h-9 text-xs font-semibold leading-4 text-white">{displayName}</p>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Hips" value={preset.hips_size} onChange={v => patch({ hips_size: v })}/>
        <Field label="Fat/Thin" value={preset.fat_thin} onChange={v => patch({ fat_thin: v })}/>
        <Field label="Breasts" value={preset.breasts_size} onChange={v => patch({ breasts_size: v })}/>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={save} className="bp-secondary">Guardar</button>
        <button onClick={restoreValues} disabled={busy} className="bp-secondary">Restaurar valores</button>
        <button onClick={generate} disabled={busy} className="bp-primary">{preset.status === "ready" ? "Regenerar" : "Generar"}</button>
      </div>
      {preset.last_error && <p className="text-[10px] text-red-400">{preset.last_error}</p>}
    </div>
  </div>;
}
