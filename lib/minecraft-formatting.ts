export interface FormattingRun {
  text: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  obfuscated: boolean;
  usesBaseColor: boolean;
}

export const minecraftColors = [
  { code: '0', name: 'Black', color: '#000000' },
  { code: '1', name: 'Dark Blue', color: '#0000aa' },
  { code: '2', name: 'Dark Green', color: '#00aa00' },
  { code: '3', name: 'Dark Aqua', color: '#00aaaa' },
  { code: '4', name: 'Dark Red', color: '#aa0000' },
  { code: '5', name: 'Dark Purple', color: '#aa00aa' },
  { code: '6', name: 'Gold', color: '#ffaa00' },
  { code: '7', name: 'Gray', color: '#aaaaaa' },
  { code: '8', name: 'Dark Gray', color: '#555555' },
  { code: '9', name: 'Blue', color: '#5555ff' },
  { code: 'a', name: 'Green', color: '#55ff55' },
  { code: 'b', name: 'Aqua', color: '#55ffff' },
  { code: 'c', name: 'Red', color: '#ff5555' },
  { code: 'd', name: 'Light Purple', color: '#ff55ff' },
  { code: 'e', name: 'Yellow', color: '#ffff55' },
  { code: 'f', name: 'White', color: '#ffffff' },
] as const;

const colorByCode = new Map<string, string>(minecraftColors.map((item) => [item.code, item.color]));

export const parseFormattingLine = (line: string, baseColor: string): FormattingRun[] => {
  const runs: FormattingRun[] = [];
  let buffer = '';
  let state = { color: baseColor, bold: false, italic: false, underline: false, strike: false, obfuscated: false, usesBaseColor: true };
  const flush = () => {
    if (!buffer) return;
    runs.push({ text: buffer, ...state });
    buffer = '';
  };

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const code = line[index + 1]?.toLowerCase();
    if ((character === '§' || character === '&') && code && /[0-9a-fklmnor]/.test(code)) {
      flush();
      if (colorByCode.has(code)) {
        state = { color: colorByCode.get(code) ?? baseColor, bold: false, italic: false, underline: false, strike: false, obfuscated: false, usesBaseColor: false };
      } else if (code === 'r') {
        state = { color: baseColor, bold: false, italic: false, underline: false, strike: false, obfuscated: false, usesBaseColor: true };
      } else if (code === 'l') state = { ...state, bold: true };
      else if (code === 'o') state = { ...state, italic: true };
      else if (code === 'n') state = { ...state, underline: true };
      else if (code === 'm') state = { ...state, strike: true };
      else if (code === 'k') state = { ...state, obfuscated: true };
      index += 1;
      continue;
    }
    buffer += character;
  }
  flush();
  return runs;
};


export function serializeMinecraftText(gameText: string, baseColor: string, options: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean } = {}) {
  return gameText.split('\n').map((line) => parseFormattingLine(line, baseColor).map((run) => {
    const color = minecraftColors.find((item) => item.color === run.color)?.code;
    return `§r${color ? `§${color}` : ''}${options.bold || run.bold ? '§l' : ''}${options.italic || run.italic ? '§o' : ''}${options.underline || run.underline ? '§n' : ''}${options.strike || run.strike ? '§m' : ''}${run.obfuscated ? '§k' : ''}${run.text}`;
  }).join('')).join('\n');
}
