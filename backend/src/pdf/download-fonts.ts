import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, "fonts");

const FONTS: { filename: string; url: string; languages: string[] }[] = [
  {
    filename: "NotoSans-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    languages: ["en"],
  },
  {
    filename: "NotoSansDevanagari-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
    languages: ["hi", "mr"],
  },
  {
    filename: "NotoSansBengali-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf",
    languages: ["bn", "as"],
  },
  {
    filename: "NotoSansTamil-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf",
    languages: ["ta"],
  },
  {
    filename: "NotoSansTelugu-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf",
    languages: ["te"],
  },
  {
    filename: "NotoSansKannada-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf",
    languages: ["kn"],
  },
  {
    filename: "NotoSansMalayalam-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf",
    languages: ["ml"],
  },
  {
    filename: "NotoSansGurmukhi-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGurmukhi/NotoSansGurmukhi-Regular.ttf",
    languages: ["pa"],
  },
  {
    filename: "NotoSansGujarati-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf",
    languages: ["gu"],
  },
  {
    filename: "NotoSansOriya-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansOriya/NotoSansOriya-Regular.ttf",
    languages: ["or"],
  },
  {
    filename: "NotoSansArabic-Regular.ttf",
    url: "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf",
    languages: ["ur"],
  },
];

export async function downloadFonts(): Promise<void> {
  mkdirSync(FONTS_DIR, { recursive: true });

  let downloaded = 0;
  for (const font of FONTS) {
    const dest = join(FONTS_DIR, font.filename);
    if (existsSync(dest)) {
      console.log(`[Font] Already exists: ${font.filename}`);
      downloaded++;
      continue;
    }

    try {
      console.log(`[Font] Downloading ${font.filename}...`);
      const resp = await fetch(font.url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buffer = Buffer.from(await resp.arrayBuffer());
      writeFileSync(dest, buffer);
      console.log(`[Font] Downloaded: ${font.filename} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
      downloaded++;
    } catch (err) {
      console.error(`[Font] Failed to download ${font.filename}: ${err}`);
    }
  }

  console.log(`[Font] ${downloaded}/${FONTS.length} fonts available`);
}

export function getFontPath(lang: string): string | null {
  const font = FONTS.find((f) => f.languages.includes(lang));
  if (!font) return null;
  const dest = join(FONTS_DIR, font.filename);
  return existsSync(dest) ? dest : null;
}

export function getFontName(lang: string): string {
  const map: Record<string, string> = {
    en: "NotoSans",
    hi: "NotoSansDevanagari",
    mr: "NotoSansDevanagari",
    bn: "NotoSansBengali",
    as: "NotoSansBengali",
    ta: "NotoSansTamil",
    te: "NotoSansTelugu",
    kn: "NotoSansKannada",
    ml: "NotoSansMalayalam",
    pa: "NotoSansGurmukhi",
    gu: "NotoSansGujarati",
    or: "NotoSansOriya",
    ur: "NotoSansArabic",
  };
  return map[lang] || "NotoSans";
}

if (process.argv[1]?.endsWith("download-fonts.ts")) {
  downloadFonts();
}
