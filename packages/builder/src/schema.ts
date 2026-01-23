import { z } from 'zod';

export const ColorPaletteSchema = z.object({
    primary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string().optional(),
    text: z.string().optional(),
});

export const TypographySchema = z.object({
    heading_font: z.string(),
    body_font: z.string(),
});

export const StyleSystemSchema = z.object({
    vibe: z.string(),
    color_palette: ColorPaletteSchema,
    typography: TypographySchema,
    radius: z.string(),
});

export const SectionSchema = z.object({
    type: z.string(),
    props: z.record(z.any()),
});

export const WebsiteBlueprintSchema = z.object({
    meta: z.object({
        style_system: StyleSystemSchema,
    }),
    structure: z.array(SectionSchema),
});

export type WebsiteBlueprint = z.infer<typeof WebsiteBlueprintSchema>;
