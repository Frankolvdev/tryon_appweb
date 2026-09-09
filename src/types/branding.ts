export interface BrandingConfig {
  app_name?: string | null;
  has_logo: boolean;
  logo: {
    small_url: string | null;
    medium_url: string | null;
    large_url: string | null;
  };
  favicon: {
    mode: "auto" | "custom";
    custom_available: boolean;
    url: string | null;
  };
  version: number;
}
