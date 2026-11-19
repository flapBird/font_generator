import { segmentGraphemes } from './unicode';

export const STENCIL_INPUT_LIMIT = 80;
export const STENCIL_SAMPLE = 'STENCIL\nLETTERS';

export const stencilPresets = [
  { id: 'classic', name: 'Classic', color: '#202331', gap: 10, spacing: 21, width: 0.88 },
  { id: 'military', name: 'Military', color: '#39452d', gap: 15, spacing: 19, width: 0.76 },
  { id: 'industrial', name: 'Industrial', color: '#252d3c', gap: 8, spacing: 24, width: 1 },
] as const;

export const stencilPaperSizes = {
  fitted: { label: 'Fit artwork', physical: null },
  a4: { label: 'A4 landscape', physical: ['297mm', '210mm'] },
  letter: { label: 'US Letter landscape', physical: ['11in', '8.5in'] },
} as const;

export type StencilPaper = keyof typeof stencilPaperSizes;
type Glyph = string | ((gap: number) => string);
type StencilSettings = { gap: number; spacing: number; width: number; paper: StencilPaper };
type StencilGlyph = { path: string; x: number; y: number; scaleX: number; scaleY: number };
export type StencilDrawing = { width: number; height: number; viewBox: string; items: StencilGlyph[]; physical: readonly [string, string] | null };

export function stencilTransform({ x, y, scaleX, scaleY }: StencilGlyph) {
  return `translate(${x},${y}) scale(${scaleX},${scaleY})`;
}

const top = (center: number, gap: number) => center - gap / 2;
const bottom = (center: number, gap: number) => center + gap / 2;

function archedRing(gap: number, tail = false) {
  return `M18 0H82L100 18V${top(59, gap)}H73V33L66 26H34L27 33V87L34 94H66L73 87V${bottom(59, gap)}H100V${tail ? '94L109 109L94 120L83 110L73 120' : '102L82 120'}H18L0 102V18Z`;
}

function twoBowls(gap: number, bevel: boolean) {
  const upperCounter = bevel ? '33L26 31V42L32 48' : '25V48';
  const lowerCounter = bevel ? '32L26 78V90L32 96' : '25V96';
  return `M${bevel ? '17 0' : '0 0'}H78L97 19V${top(36, gap)}H70V30L64 24H${upperCounter}H64L70 42V${bottom(36, gap)}H97V50L87 59L99 71V${top(84, gap)}H72V78L66 72H${lowerCounter}H66L72 90V${bottom(84, gap)}H99V102L81 120H${bevel ? '17L0 103V17' : '0'}Z`;
}

function upperBowl(gap: number, leg: boolean) {
  return `M0 0H79L97 17V${top(36, gap)}H71V31L65 25H26V49H65L71 43V${bottom(36, gap)}H97V57L80 74H${leg ? '72L100 120H70L42 74H26' : '26'}V120H0Z`;
}

const glyphs: Record<string, Glyph> = {
  A: (gap) => {
    const cutTop = top(51, gap);
    const cutBottom = bottom(51, gap);
    return `M25 0H75L100 120H73L67 93H33L27 120H0L${25 - cutBottom * 25 / 120} ${cutBottom}H${46 - (cutBottom - 26) / 6}L37 75H63L54 26H46L${46 - (cutTop - 26) / 6} ${cutTop}H${25 - cutTop * 25 / 120}Z`;
  },
  B: (gap) => twoBowls(gap, false),
  C: 'M18 0H82L100 18V36H73V33L66 26H34L27 33V87L34 94H66L73 87V84H100V102L82 120H18L0 102V18Z',
  D: (gap) => `M0 0H76L100 24V${top(59, gap)}H72V37L61 26H27V94H61L72 83V${bottom(59, gap)}H100V96L76 120H0Z`,
  E: 'M0 0H98V26H27V46H84V72H27V94H98V120H0Z',
  F: 'M0 0H98V26H27V48H83V74H27V120H0Z',
  G: 'M18 0H82L100 18V35H73V33L66 26H34L27 33V87L34 94H66L73 87V73H52V51H100V102L82 120H18L0 102V18Z',
  H: 'M0 0H27V46H73V0H100V120H73V73H27V120H0Z',
  I: 'M12 0H88V25H64V95H88V120H12V95H36V25H12Z',
  J: 'M72 0H100V102L82 120H18L0 102V75H27V87L34 94H66L72 87Z',
  K: 'M0 0H27V47L68 0H100L53 55L100 120H66L33 75L27 82V120H0Z',
  L: 'M0 0H27V94H97V120H0Z',
  M: 'M0 0H26L50 32L74 0H100V120H74V44L50 75L26 44V120H0Z',
  N: 'M0 0H25L73 71V0H100V120H75L27 49V120H0Z',
  O: (gap) => archedRing(gap),
  P: (gap) => upperBowl(gap, false),
  Q: (gap) => archedRing(gap, true),
  R: (gap) => upperBowl(gap, true),
  S: 'M18 0H82L100 18V33H73V31L68 25H32L27 31V41L33 47H82L100 65V102L82 120H18L0 102V87H27V89L32 95H68L73 89V78L67 72H18L0 54V18Z',
  T: 'M0 0H100V26H63V120H36V26H0Z',
  U: 'M0 0H27V87L34 94H66L73 87V0H100V102L82 120H18L0 102Z',
  V: 'M0 0H28L50 88L72 0H100L67 120H33Z',
  W: 'M0 0H26L35 77L43 41H57L65 77L74 0H100L81 120H59L50 88L41 120H19Z',
  X: 'M0 0H30L50 37L70 0H100L65 58L100 120H70L50 81L30 120H0L35 58Z',
  Y: 'M0 0H31L50 40L69 0H100L64 68V120H36V68Z',
  Z: 'M0 0H100V24L35 94H100V120H0V96L65 26H0Z',
  '0': (gap) => `M25 0H75L94 19V${top(59, gap)}H68V32L62 26H38L32 32V88L38 94H62L68 88V${bottom(59, gap)}H94V101L75 120H25L6 101V19Z`,
  '1': 'M21 21L43 0H69V94H91V120H18V94H42V35L21 53Z',
  '2': 'M18 0H82L100 18V48L33 95H100V120H0V92L73 39V32L67 26H33L27 32V39H0V18Z',
  '3': 'M0 0H82L100 18V48L89 59L100 70V102L82 120H0V94H67L73 88V78L66 72H28V47H66L73 40V32L67 26H0Z',
  '4': 'M42 0H70L25 70H55V36H81V70H100V94H81V120H55V94H0V70Z',
  '5': 'M0 0H96V26H27V46H82L100 64V102L82 120H18L0 102V88H27V89L32 94H67L73 88V77L67 71H0Z',
  '6': (gap) => `M18 0H96V26H33L27 32V47H81L100 66V${top(84, gap)}H73V77L67 71H27V88L33 94H67L73 88V${bottom(84, gap)}H100V102L82 120H18L0 102V18Z`,
  '7': 'M0 0H100V25L46 120H16L70 26H0Z',
  '8': (gap) => twoBowls(gap, true),
  '9': (gap) => `M18 0H82L100 18V102L82 120H4V94H67L73 88V73H18L0 55V${bottom(35, gap)}H27V42L33 48H73V32L67 26H33L27 32V${top(35, gap)}H0V18Z`,
  '.': 'M13 94H39V120H13Z',
  ',': 'M13 92H39V108L27 120H10L15 108H13Z',
  '-': 'M0 52H52V77H0Z',
  '/': 'M50 0H78L28 120H0Z',
  '!': 'M13 0H39V80H13ZM13 94H39V120H13Z',
  '?': 'M18 0H80L98 18V53L63 75V81H37V61L71 40V32L65 26H33L27 32V39H0V18ZM37 94H63V120H37Z',
  ':': 'M13 33H39V59H13ZM13 77H39V103H13Z',
  '+': 'M28 26H53V52H79V77H53V103H28V77H2V52H28Z',
};

const glyphWidths: Partial<Record<string, number>> = {
  ' ': 50, Q: 109, '.': 52, ',': 52, '-': 52, '/': 78, '!': 52, ':': 52, '+': 81,
};
const LETTER_HEIGHT = 120;
const LINE_HEIGHT = 162;
const WRAP_AT = 16;

export function stencilText(text: string) {
  const unsupported = new Set<string>();
  const lines = text.replace(/\r\n?/g, '\n').split('\n').flatMap((line) => {
    const printable = segmentGraphemes(line).map((character) => {
      if (character === ' ' || character === '\t') return ' ';
      const capital = /^[a-z]$/.test(character) ? character.toUpperCase() : character;
      if (Object.hasOwn(glyphs, capital)) return capital;
      unsupported.add(character);
      return '';
    }).join('').trim();
    const wrapped: string[] = [];
    let remaining = printable;
    while (remaining.length > WRAP_AT) {
      const breakAt = remaining.lastIndexOf(' ', WRAP_AT);
      const end = breakAt > 0 ? breakAt : WRAP_AT;
      wrapped.push(remaining.slice(0, end));
      remaining = remaining.slice(end).trimStart();
    }
    return [...wrapped, remaining];
  });
  return { lines: lines.join('\n').trim().split('\n'), unsupported: [...unsupported] };
}

export function drawStencilLetters(lines: readonly string[], settings: StencilSettings): StencilDrawing | null {
  if (!lines.some((line) => line.trim())) return null;
  const { gap, spacing, width: glyphScale } = settings;
  const lineWidths = lines.map((line) => Array.from(line).reduce((total, character, index) =>
    total + (glyphWidths[character] ?? 100) * glyphScale + (index ? spacing : 0), 0));
  const inkWidth = Math.max(...lineWidths);
  const inkHeight = (lines.length - 1) * LINE_HEIGHT + LETTER_HEIGHT;
  const physical = stencilPaperSizes[settings.paper].physical;
  const paperRatio = settings.paper === 'a4' ? 297 / 210 : 11 / 8.5;
  const viewWidth = physical ? 1100 : Math.ceil(inkWidth + 104);
  const viewHeight = physical ? Math.round(viewWidth / paperRatio) : inkHeight + 104;
  const scale = physical ? Math.min((viewWidth - 126) / inkWidth, (viewHeight - 126) / inkHeight) : 1;
  const startY = (viewHeight - inkHeight * scale) / 2;
  const items = lines.flatMap((line, row) => {
    let x = (viewWidth - lineWidths[row] * scale) / 2;
    return Array.from(line).flatMap((character) => {
      const left = x;
      x += ((glyphWidths[character] ?? 100) * glyphScale + spacing) * scale;
      const path = glyphs[character];
      return path ? [{ path: typeof path === 'function' ? path(gap) : path, x: left, y: startY + row * LINE_HEIGHT * scale, scaleX: scale * glyphScale, scaleY: scale }] : [];
    });
  });
  return { width: viewWidth, height: viewHeight, items, viewBox: `0 0 ${viewWidth} ${viewHeight}`, physical };
}

export function stencilSvg(drawing: StencilDrawing, color: string) {
  const [width, height] = drawing.physical ?? [drawing.width, drawing.height];
  const paths = drawing.items.map((item) => `<path d="${item.path}" transform="${stencilTransform(item)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${drawing.viewBox}"><g fill="${color}">${paths}</g></svg>`;
}
