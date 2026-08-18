export type ModelSex = "woman" | "man";
export interface BodyVariant { id:number; display_name:string; sex:ModelSex; hips_size:number; fat_thin:number; breasts_size:number; skin_tone:number; hair_length:number; fat_band:string|null; hips_band:string|null; breast_band:string|null; image_url:string; sort_order:number; }
export interface BodyVariantCatalog { items:BodyVariant[]; total:number; }
export interface AiModelProfile { id:number; name:string; sex:ModelSex; body_proportion_preset_id:number|null; bubble_butt_preset_id:number|null; bubble_butt_variant_index:number|null; body_image_url:string|null; stage:string; draft_json?:Record<string,unknown>; created_at:string; updated_at:string; }

export interface BubbleButtVariant { id:number; variant_index:number; display_name:string; bubble_butt:number; image_url:string; }
export interface BubbleButtVariantCatalog { items:BubbleButtVariant[]; total:number; }
