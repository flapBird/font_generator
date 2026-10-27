// Metadata only: safe for server rendering and directory listings. Font files are
// loaded by the artwork workspace, never by the homepage or shared layout.
export const octoberTextSlugs = ['k-pop-font-generator', 'wingdings-font-generator', 'preppy-font-generator', 'emoji-font-generator', 'gaming-font-generator'] as const;
export const octoberArtSlugs = ['halloween-font-generator', 'korean-font-generator', 'chinese-font-generator', 'graffiti-font-generator', 'arabic-font-generator'] as const;
export const octoberSlugs = [...octoberArtSlugs, ...octoberTextSlugs];
export const isOctoberText = (slug: string) => octoberTextSlugs.some((value) => value === slug);
export const isOctoberArt = (slug: string) => octoberArtSlugs.some((value) => value === slug);

export interface ArtworkFont { id: string; family: string; label: string; coverage: string }
export interface OctoberArtworkConfig {
  sample: string; samples: string[]; language: string; direction: 'ltr' | 'rtl';
  intro: string; fonts: ArtworkFont[]; color: string; background: string; effects?: boolean;
}
const font = (id: string, family: string, label: string, coverage: string): ArtworkFont => ({ id, family, label, coverage });
export const octoberArtwork: Record<string, OctoberArtworkConfig> = {
  'halloween-font-generator': {
    sample: 'Happy Halloween', samples: ['Happy Halloween', 'Trick or Treat', 'Haunted House'], language: 'en', direction: 'ltr',
    intro: 'Make spooky titles for party invitations, posters and thumbnails. Download the lettering as a transparent PNG, or jump to the separate copyable text below.', color: '#f97316', background: '#17121d', effects: true,
    fonts: [font('creepster', 'Creepster', 'Monster lettering', 'Latin'), font('nosifer', 'Nosifer', 'Dripping horror', 'Latin'), font('eater', 'Eater', 'Rough haunted letters', 'Latin')],
  },
  'korean-font-generator': {
    sample: '사랑해', samples: ['사랑해', '안녕하세요', '나의 작은 세상'], language: 'ko', direction: 'ltr',
    intro: 'Style your own Hangul in real Korean typefaces for names, fan graphics and messages. Copying keeps the original characters; PNG preserves the chosen typeface. This tool does not translate or transliterate.', color: '#7c3aed', background: '#fff7ed',
    fonts: [font('jua', 'Jua', 'Rounded display', 'Hangul and Latin'), font('gaegu', 'Gaegu', 'Playful handwriting', 'Hangul and Latin'), font('nanum-pen-script', 'Nanum Pen Script', 'Pen handwriting', 'Hangul and Latin'), font('black-han-sans', 'Black Han Sans', 'Heavy headlines', 'Hangul and Latin')],
  },
  'chinese-font-generator': {
    sample: '春风得意', samples: ['春风得意', '山高水长', '歲月靜好'], language: 'zh', direction: 'ltr',
    intro: 'Compare modern Chinese text and brush lettering, then export your name or phrase as a PNG. Simplified and Traditional labels describe font coverage; choosing a font does not convert your text.', color: '#292524', background: '#fffbeb',
    fonts: [font('ma-shan-zheng', 'Ma Shan Zheng', 'Brush calligraphy', 'Simplified Chinese'), font('zhi-mang-xing', 'Zhi Mang Xing', 'Expressive handwriting', 'Simplified Chinese'), font('noto-sans-sc', 'Noto Sans SC', 'Modern sans serif', 'Simplified Chinese'), font('noto-serif-tc', 'Noto Serif TC', 'Traditional serif', 'Traditional Chinese')],
  },
  'arabic-font-generator': {
    sample: 'أهلاً وسهلاً', samples: ['أهلاً وسهلاً', 'السلام عليكم', 'عيد مبارك'], language: 'ar', direction: 'rtl',
    intro: 'Preview Arabic names and greetings with joined lettering, right-to-left layout and preserved diacritics. Download a PNG to keep the appearance. Enter Arabic directly; this is not a translator.', color: '#065f46', background: '#f0fdf4',
    fonts: [font('amiri', 'Amiri', 'Naskh book style', 'Arabic and Latin'), font('cairo', 'Cairo', 'Modern geometric', 'Arabic and Latin'), font('lateef', 'Lateef', 'Flowing calligraphic', 'Arabic and Latin'), font('reem-kufi', 'Reem Kufi', 'Kufi display', 'Arabic and Latin')],
  },
  'graffiti-font-generator': {
    sample: 'STREET ART', samples: ['STREET ART', 'FRESH', 'Your Tag'], language: 'en', direction: 'ltr',
    intro: 'Create spray, marker, bubble and hand-drawn tag lettering. Customize the fill, outline and shadow, then download a transparent PNG for stickers, covers or design drafts.', color: '#a3e635', background: '#18181b', effects: true,
    fonts: [font('rubik-spray-paint', 'Rubik Spray Paint', 'Spray texture', 'Latin'), font('permanent-marker', 'Permanent Marker', 'Marker tag', 'Latin'), font('rubik-bubbles', 'Rubik Bubbles', 'Bubble lettering', 'Latin'), font('sedgwick-ave-display', 'Sedgwick Ave Display', 'Hand-drawn tag', 'Latin')],
  },
};
