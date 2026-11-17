const values: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
export function toRoman(n: number) { let out = ''; for (const [value, symbol] of values) while(n >= value) { out += symbol; n -= value; } return out; }
export function convertRoman(input: string) {
 const text = input.trim().toUpperCase(); if (!text) return '';
 if (/^\d+$/.test(text)) { const n = Number(text); return n >= 1 && n <= 3999 ? toRoman(n) : 'Enter a whole number from 1 to 3999.'; }
 if (!/^(?=.)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(text)) return 'Enter canonical Roman numerals, such as XIV (not IIII).';
 let rest = text, n = 0; for (const [value,symbol] of values) while(rest.startsWith(symbol)) { n += value; rest = rest.slice(symbol.length); } return String(n);
}
export const emojiWords: Record<string,string> = { love:'❤️', heart:'❤️', happy:'😊', sad:'😢', coffee:'☕', tea:'🍵', cat:'🐱', cats:'🐱', dog:'🐶', dogs:'🐶', sun:'☀️', moon:'🌙', star:'⭐', fire:'🔥', hello:'👋', world:'🌍', pizza:'🍕', cake:'🎂', birthday:'🎂', music:'🎵', book:'📚', books:'📚', flower:'🌸', flowers:'🌸', smile:'😊', cool:'😎', rain:'🌧️', home:'🏠', car:'🚗', yes:'✅', no:'❌', party:'🎉' };
export const translateEmoji = (text: string) => text.replace(/[\p{L}\p{M}]+/gu, word => emojiWords[word.toLowerCase()] ?? word);
