import { del, get, post, put } from "./client";
import { ApiResponse } from "./types";
import { QRDesignOptions } from "@/components/qr/QRDesignCustomizer";

// Design Preset Types
export interface DesignPreset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  design_options: QRDesignOptions;
  thumbnail_url?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePresetRequest {
  name: string;
  description?: string;
  design_options: QRDesignOptions;
  is_default?: boolean;
}

export interface UpdatePresetRequest {
  name?: string;
  description?: string;
  design_options?: QRDesignOptions;
  is_default?: boolean;
}

// Pre-built template gallery (client-side, no backend needed)
export interface TemplateStyle {
  id: string;
  name: string;
  description: string;
  category: "professional" | "creative" | "minimal" | "bold" | "seasonal";
  design_options: QRDesignOptions;
  previewColors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
}

// Pre-designed templates
export const templateGallery: TemplateStyle[] = [
  {
    id: "classic-black",
    name: "Classic Black",
    description: "Timeless black and white design",
    category: "professional",
    previewColors: { primary: "#000000", secondary: "#FFFFFF" },
    design_options: {
      shapeStyle: "squares",
      bgColor: "#FFFFFF",
      fgColor: "#000000",
      transparentBg: false,
      gradient: false,
      cornerStyle: "square",
      cornerColor: "#000000",
      centerStyle: "square",
      centerColor: "#000000",
      frameStyle: "none",
      frameColor: "#000000",
      frameText: "SCAN ME",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Professional blue gradient",
    category: "professional",
    previewColors: { primary: "#1B9AAA", secondary: "#FFFFFF", accent: "#0D5C63" },
    design_options: {
      shapeStyle: "rounded",
      bgColor: "#FFFFFF",
      fgColor: "#1B9AAA",
      transparentBg: false,
      gradient: true,
      gradientColor: "#0D5C63",
      cornerStyle: "rounded",
      cornerColor: "#0D5C63",
      centerStyle: "circle",
      centerColor: "#1B9AAA",
      frameStyle: "simple",
      frameColor: "#1B9AAA",
      frameText: "SCAN ME",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "sunset-gradient",
    name: "Sunset Gradient",
    description: "Warm orange to pink gradient",
    category: "creative",
    previewColors: { primary: "#F97316", secondary: "#FFFFFF", accent: "#EC4899" },
    design_options: {
      shapeStyle: "dots",
      bgColor: "#FFFFFF",
      fgColor: "#F97316",
      transparentBg: false,
      gradient: true,
      gradientColor: "#EC4899",
      cornerStyle: "circle",
      cornerColor: "#F97316",
      centerStyle: "star",
      centerColor: "#EC4899",
      frameStyle: "rounded",
      frameColor: "#F97316",
      frameText: "SCAN NOW",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Deep purple elegance",
    category: "bold",
    previewColors: { primary: "#7C3AED", secondary: "#F5F3FF", accent: "#4C1D95" },
    design_options: {
      shapeStyle: "classy-rounded",
      bgColor: "#F5F3FF",
      fgColor: "#7C3AED",
      transparentBg: false,
      gradient: true,
      gradientColor: "#4C1D95",
      cornerStyle: "classy",
      cornerColor: "#4C1D95",
      centerStyle: "diamond",
      centerColor: "#7C3AED",
      frameStyle: "badge",
      frameColor: "#7C3AED",
      frameText: "SCAN ME",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural eco-friendly look",
    category: "professional",
    previewColors: { primary: "#059669", secondary: "#ECFDF5", accent: "#047857" },
    design_options: {
      shapeStyle: "rounded",
      bgColor: "#ECFDF5",
      fgColor: "#059669",
      transparentBg: false,
      gradient: false,
      cornerStyle: "leaf",
      cornerColor: "#047857",
      centerStyle: "circle",
      centerColor: "#059669",
      frameStyle: "banner-bottom",
      frameColor: "#059669",
      frameText: "ECO FRIENDLY",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "minimal-gray",
    name: "Minimal Gray",
    description: "Clean and understated",
    category: "minimal",
    previewColors: { primary: "#374151", secondary: "#F9FAFB" },
    design_options: {
      shapeStyle: "squares",
      bgColor: "#F9FAFB",
      fgColor: "#374151",
      transparentBg: false,
      gradient: false,
      cornerStyle: "square",
      cornerColor: "#374151",
      centerStyle: "none",
      centerColor: "#374151",
      frameStyle: "none",
      frameColor: "#374151",
      frameText: "",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "coral-pop",
    name: "Coral Pop",
    description: "Vibrant coral with energy",
    category: "bold",
    previewColors: { primary: "#F43F5E", secondary: "#FFF1F2", accent: "#BE123C" },
    design_options: {
      shapeStyle: "extra-rounded",
      bgColor: "#FFF1F2",
      fgColor: "#F43F5E",
      transparentBg: false,
      gradient: true,
      gradientColor: "#BE123C",
      cornerStyle: "rounded-dot",
      cornerColor: "#F43F5E",
      centerStyle: "dot",
      centerColor: "#BE123C",
      frameStyle: "ticket",
      frameColor: "#F43F5E",
      frameText: "SCAN HERE",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "gold-luxury",
    name: "Gold Luxury",
    description: "Premium gold aesthetic",
    category: "bold",
    previewColors: { primary: "#CA8A04", secondary: "#FFFBEB", accent: "#A16207" },
    design_options: {
      shapeStyle: "classy",
      bgColor: "#FFFBEB",
      fgColor: "#CA8A04",
      transparentBg: false,
      gradient: true,
      gradientColor: "#A16207",
      cornerStyle: "classy",
      cornerColor: "#A16207",
      centerStyle: "diamond",
      centerColor: "#CA8A04",
      frameStyle: "badge",
      frameColor: "#CA8A04",
      frameText: "PREMIUM",
      frameTextColor: "#FFFBEB",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    description: "Futuristic neon style",
    category: "creative",
    previewColors: { primary: "#06B6D4", secondary: "#0F172A", accent: "#22D3EE" },
    design_options: {
      shapeStyle: "edge-cut",
      bgColor: "#0F172A",
      fgColor: "#06B6D4",
      transparentBg: false,
      gradient: true,
      gradientColor: "#22D3EE",
      cornerStyle: "dot",
      cornerColor: "#22D3EE",
      centerStyle: "plus",
      centerColor: "#06B6D4",
      frameStyle: "simple",
      frameColor: "#06B6D4",
      frameText: "CONNECT",
      frameTextColor: "#0F172A",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "pastel-pink",
    name: "Pastel Pink",
    description: "Soft and approachable",
    category: "creative",
    previewColors: { primary: "#EC4899", secondary: "#FDF2F8", accent: "#DB2777" },
    design_options: {
      shapeStyle: "fluid",
      bgColor: "#FDF2F8",
      fgColor: "#EC4899",
      transparentBg: false,
      gradient: false,
      cornerStyle: "flower",
      cornerColor: "#DB2777",
      centerStyle: "star",
      centerColor: "#EC4899",
      frameStyle: "rounded",
      frameColor: "#EC4899",
      frameText: "SCAN ME ♥",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "monochrome-dots",
    name: "Monochrome Dots",
    description: "Modern dotted pattern",
    category: "minimal",
    previewColors: { primary: "#18181B", secondary: "#FAFAFA" },
    design_options: {
      shapeStyle: "dots",
      bgColor: "#FAFAFA",
      fgColor: "#18181B",
      transparentBg: false,
      gradient: false,
      cornerStyle: "circle",
      cornerColor: "#18181B",
      centerStyle: "dot",
      centerColor: "#18181B",
      frameStyle: "none",
      frameColor: "#18181B",
      frameText: "",
      frameTextColor: "#FAFAFA",
      logo: null,
      logoPreset: null,
    },
  },
  {
    id: "christmas-red",
    name: "Christmas Red",
    description: "Festive holiday style",
    category: "seasonal",
    previewColors: { primary: "#DC2626", secondary: "#FEF2F2", accent: "#166534" },
    design_options: {
      shapeStyle: "rounded",
      bgColor: "#FEF2F2",
      fgColor: "#DC2626",
      transparentBg: false,
      gradient: true,
      gradientColor: "#166534",
      cornerStyle: "flower",
      cornerColor: "#166534",
      centerStyle: "star",
      centerColor: "#DC2626",
      frameStyle: "banner-top",
      frameColor: "#DC2626",
      frameText: "HAPPY HOLIDAYS",
      frameTextColor: "#FFFFFF",
      logo: null,
      logoPreset: null,
    },
  },
];

// Design Preset API
export const designPresetApi = {
  /**
   * Get all user's design presets
   * GET /api/design-presets
   */
  list: async (): Promise<ApiResponse<DesignPreset[]>> => {
    return get("/design-presets");
  },

  /**
   * Get a single preset by ID
   * GET /api/design-presets/:id
   */
  get: async (id: string): Promise<ApiResponse<DesignPreset>> => {
    return get(`/design-presets/${id}`);
  },

  /**
   * Create a new design preset
   * POST /api/design-presets
   */
  create: async (data: CreatePresetRequest): Promise<ApiResponse<DesignPreset>> => {
    return post("/design-presets", data);
  },

  /**
   * Update a design preset
   * PUT /api/design-presets/:id
   */
  update: async (id: string, data: UpdatePresetRequest): Promise<ApiResponse<DesignPreset>> => {
    return put(`/design-presets/${id}`, data);
  },

  /**
   * Delete a design preset
   * DELETE /api/design-presets/:id
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return del(`/design-presets/${id}`);
  },

  /**
   * Set a preset as default
   * POST /api/design-presets/:id/set-default
   */
  setDefault: async (id: string): Promise<ApiResponse<DesignPreset>> => {
    return post(`/design-presets/${id}/set-default`);
  },
};
