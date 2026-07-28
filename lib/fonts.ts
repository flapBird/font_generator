export interface LogoStyle {
  id: string;
  name: string;
  fontFamily: string;
  style: React.CSSProperties;
}

// Unicode character mappings for fancy text
const unicodeMappings: Record<string, Record<string, string>> = {
  bold: {
    a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣',
    k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭',
    u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
    A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉',
    K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓',
    U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙',
  },
  italic: {
    a: '𝑎', b: '𝑏', c: '𝑐', d: '𝑑', e: '𝑒', f: '𝑓', g: '𝑔', h: 'ℎ', i: '𝑖', j: '𝑗',
    k: '𝑘', l: '𝑙', m: '𝑚', n: '𝑛', o: '𝑜', p: '𝑝', q: '𝑞', r: '𝑟', s: '𝑠', t: '𝑡',
    u: '𝑢', v: '𝑣', w: '𝑤', x: '𝑥', y: '𝑦', z: '𝑧',
    A: '𝐴', B: '𝐵', C: '𝐶', D: '𝐷', E: '𝐸', F: '𝐹', G: '𝐺', H: '𝐻', I: '𝐼', J: '𝐽',
    K: '𝐾', L: '𝐿', M: '𝑀', N: '𝑁', O: '𝑂', P: '𝑃', Q: '𝑄', R: '𝑅', S: '𝑆', T: '𝑇',
    U: '𝑈', V: '𝑉', W: '𝑊', X: '𝑋', Y: '𝑌', Z: '𝑍',
  },
  boldItalic: {
    a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
    k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
    u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
    A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
    K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
    U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
  },
  script: {
    a: '𝒶', b: '𝒷', c: '𝒸', d: '𝒹', e: 'ℯ', f: '𝒻', g: 'ℊ', h: '𝒽', i: '𝒾', j: '𝒿',
    k: '𝓀', l: '𝓁', m: '𝓂', n: '𝓃', o: 'ℴ', p: '𝓅', q: '𝓆', r: '𝓇', s: '𝓈', t: '𝓉',
    u: '𝓊', v: '𝓋', w: '𝓌', x: '𝓍', y: '𝓎', z: '𝓏',
    A: '𝒜', B: 'ℬ', C: '𝒞', D: '𝒟', E: 'ℰ', F: 'ℱ', G: '𝒢', H: 'ℋ', I: 'ℐ', J: '𝒥',
    K: '𝒦', L: 'ℒ', M: 'ℳ', N: '𝒩', O: '𝒪', P: '𝒫', Q: '𝒬', R: 'ℛ', S: '𝒮', T: '𝒯',
    U: '𝒰', V: '𝒱', W: '𝒲', X: '𝒳', Y: '𝒴', Z: '𝒵',
  },
  fraktur: {
    a: '𝔞', b: '𝔟', c: '𝔠', d: '𝔡', e: '𝔢', f: '𝔣', g: '𝔤', h: '𝔥', i: '𝔦', j: '𝔧',
    k: '𝔨', l: '𝔩', m: '𝔪', n: '𝔫', o: '𝔬', p: '𝔭', q: '𝔮', r: '𝔯', s: '𝔰', t: '𝔱',
    u: '𝔲', v: '𝔳', w: '𝔴', x: '𝔵', y: '𝔶', z: '𝔷',
    A: '𝔄', B: '𝔅', C: 'ℭ', D: '𝔇', E: '𝔈', F: '𝔉', G: '𝔊', H: 'ℌ', I: 'ℑ', J: '𝔍',
    K: '𝔎', L: '𝔏', M: '𝔐', N: '𝔑', O: '𝔒', P: '𝔓', Q: '𝔔', R: 'ℜ', S: '𝔖', T: '𝔗',
    U: '𝔘', V: '𝔙', W: '𝔚', X: '𝔛', Y: '𝔜', Z: 'ℨ',
  },
  monospace: {
    a: '𝚊', b: '𝚋', c: '𝚌', d: '𝚍', e: '𝚎', f: '𝚏', g: '𝚐', h: '𝚑', i: '𝚒', j: '𝚓',
    k: '𝚔', l: '𝚕', m: '𝚖', n: '𝚗', o: '𝚘', p: '𝚙', q: '𝚚', r: '𝚛', s: '𝚜', t: '𝚝',
    u: '𝚞', v: '𝚟', w: '𝚠', x: '𝚡', y: '𝚢', z: '𝚣',
    A: '𝙰', B: '𝙱', C: '𝙲', D: '𝙳', E: '𝙴', F: '𝙵', G: '𝙶', H: '𝙷', I: '𝙸', J: '𝙹',
    K: '𝙺', L: '𝙻', M: '𝙼', N: '𝙽', O: '𝙾', P: '𝙿', Q: '𝚀', R: '𝚁', S: '𝚂', T: '𝚃',
    U: '𝚄', V: '𝚅', W: '𝚆', X: '𝚇', Y: '𝚈', Z: '𝚉',
  },
  doubleStruck: {
    a: '𝕒', b: '𝕓', c: '𝕔', d: '𝕕', e: '𝕖', f: '𝕗', g: '𝕘', h: '𝕙', i: '𝕚', j: '𝕛',
    k: '𝕜', l: '𝕝', m: '𝕞', n: '𝕟', o: '𝕠', p: '𝕡', q: '𝕢', r: '𝕣', s: '𝕤', t: '𝕥',
    u: '𝕦', v: '𝕧', w: '𝕨', x: '𝕩', y: '𝕪', z: '𝕫',
    A: '𝔸', B: '𝔹', C: 'ℂ', D: '𝔻', E: '𝔼', F: '𝔽', G: '𝔾', H: 'ℍ', I: '𝕀', J: '𝕁',
    K: '𝕂', L: '𝕃', M: '𝕄', N: 'ℕ', O: '𝕆', P: 'ℙ', Q: 'ℚ', R: 'ℝ', S: '𝕊', T: '𝕋',
    U: '𝕌', V: '𝕍', W: '𝕎', X: '𝕏', Y: '𝕐', Z: 'ℤ',
  },
  circled: {
    a: 'ⓐ', b: 'ⓑ', c: 'ⓒ', d: 'ⓓ', e: 'ⓔ', f: 'ⓕ', g: 'ⓖ', h: 'ⓗ', i: 'ⓘ', j: 'ⓙ',
    k: 'ⓚ', l: 'ⓛ', m: 'ⓜ', n: 'ⓝ', o: 'ⓞ', p: 'ⓟ', q: 'ⓠ', r: 'ⓡ', s: 'ⓢ', t: 'ⓣ',
    u: 'ⓤ', v: 'ⓥ', w: 'ⓦ', x: 'ⓧ', y: 'ⓨ', z: 'ⓩ',
    A: 'Ⓐ', B: 'Ⓑ', C: 'Ⓒ', D: 'Ⓓ', E: 'Ⓔ', F: 'Ⓕ', G: 'Ⓖ', H: 'Ⓗ', I: 'Ⓘ', J: 'Ⓙ',
    K: 'Ⓚ', L: 'Ⓛ', M: 'Ⓜ', N: 'Ⓝ', O: 'Ⓞ', P: 'Ⓟ', Q: 'Ⓠ', R: 'Ⓡ', S: 'Ⓢ', T: 'Ⓣ',
    U: 'Ⓤ', V: 'Ⓥ', W: 'Ⓦ', X: 'Ⓧ', Y: 'Ⓨ', Z: 'Ⓩ',
  },
  squared: {
    A: '🄰', B: '🄱', C: '🄲', D: '🄳', E: '🄴', F: '🄵', G: '🄶', H: '🄷', I: '🄸', J: '🄹',
    K: '🄺', L: '🄻', M: '🄼', N: '🄽', O: '🄾', P: '🄿', Q: '🅀', R: '🅁', S: '🅂', T: '🅃',
    U: '🅄', V: '🅅', W: '🅆', X: '🅇', Y: '🅈', Z: '🅉',
  },
  parenthesized: {
    a: '⒜', b: '⒝', c: '⒞', d: '⒟', e: '⒠', f: '⒡', g: '⒢', h: '⒣', i: '⒤', j: '⒥',
    k: '⒦', l: '⒧', m: '⒨', n: '⒩', o: '⒪', p: '⒫', q: '⒬', r: '⒭', s: '⒮', t: '⒯',
    u: '⒰', v: '⒱', w: '⒲', x: '⒳', y: '⒴', z: '⒵',
  },
  fullwidth: {
    a: 'ａ', b: 'ｂ', c: 'ｃ', d: 'ｄ', e: 'ｅ', f: 'ｆ', g: 'ｇ', h: 'ｈ', i: 'ｉ', j: 'ｊ',
    k: 'ｋ', l: 'ｌ', m: 'ｍ', n: 'ｎ', o: 'ｏ', p: 'ｐ', q: 'ｑ', r: 'ｒ', s: 'ｓ', t: 'ｔ',
    u: 'ｕ', v: 'ｖ', w: 'ｗ', x: 'ｘ', y: 'ｙ', z: 'ｚ',
    A: 'Ａ', B: 'Ｂ', C: 'Ｃ', D: 'Ｄ', E: 'Ｅ', F: 'Ｆ', G: 'Ｇ', H: 'Ｈ', I: 'Ｉ', J: 'Ｊ',
    K: 'Ｋ', L: 'Ｌ', M: 'Ｍ', N: 'Ｎ', O: 'Ｏ', P: 'Ｐ', Q: 'Ｑ', R: 'Ｒ', S: 'Ｓ', T: 'Ｔ',
    U: 'Ｕ', V: 'Ｖ', W: 'Ｗ', X: 'Ｘ', Y: 'Ｙ', Z: 'Ｚ',
  },
  smallCaps: {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
  },
  superscript: {
    a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ',
    k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', q: 'q', r: 'ʳ', s: 'ˢ', t: 'ᵗ',
    u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  },
  subscript: {
    a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ',
    p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
  },
  inverted: {
    a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ',
    k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ',
    u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
    A: '∀', B: 'B', C: 'Ɔ', D: 'D', E: 'Ǝ', F: 'Ⅎ', G: 'פ', H: 'H', I: 'I', J: 'ſ',
    K: 'K', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Q', R: 'R', S: 'S', T: '┴',
    U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
  },
  strikethrough: {
    a: 'a̶', b: 'b̶', c: 'c̶', d: 'd̶', e: 'e̶', f: 'f̶', g: 'g̶', h: 'h̶', i: 'i̶', j: 'j̶',
    k: 'k̶', l: 'l̶', m: 'm̶', n: 'n̶', o: 'o̶', p: 'p̶', q: 'q̶', r: 'r̶', s: 's̶', t: 't̶',
    u: 'u̶', v: 'v̶', w: 'w̶', x: 'x̶', y: 'y̶', z: 'z̶',
    A: 'A̶', B: 'B̶', C: 'C̶', D: 'D̶', E: 'E̶', F: 'F̶', G: 'G̶', H: 'H̶', I: 'I̶', J: 'J̶',
    K: 'K̶', L: 'L̶', M: 'M̶', N: 'N̶', O: 'O̶', P: 'P̶', Q: 'Q̶', R: 'R̶', S: 'S̶', T: 'T̶',
    U: 'U̶', V: 'V̶', W: 'W̶', X: 'X̶', Y: 'Y̶', Z: 'Z̶',
  },
  emojiMix: {
    a: '🅰', b: '🅱', c: '©', d: '🇩', e: '📧', f: '🎏', g: '🌀', h: '♓', i: 'ℹ', j: '🎷',
    k: '🎋', l: '👢', m: 'Ⓜ', n: '♑', o: '⭕', p: '🅿', q: '🔍', r: '®', s: '💲', t: '✝',
    u: '⛎', v: '✅', w: '〰', x: '❌', y: '💴', z: '💤',
    A: '🅰', B: '🅱', C: '©', D: '🇩', E: '📧', F: '🎏', G: '🌀', H: '♓', I: 'ℹ', J: '🎷',
    K: '🎋', L: '👢', M: 'Ⓜ', N: '♑', O: '⭕', P: '🅿', Q: '🔍', R: '®', S: '💲', T: '✝',
    U: '⛎', V: '✅', W: '〰', X: '❌', Y: '💴', Z: '💤',
  },
  emojiCute: {
    a: '🍎', b: '🦋', c: '🌙', d: '🌸', e: '🌟', f: '🌺', g: '🍇', h: '🌿', i: '🍦', j: '🎀',
    k: '🦄', l: '🌷', m: '🍄', n: '🌻', o: '🍩', p: '🌈', q: '👑', r: '🌹', s: '⭐', t: '🌴',
    u: '🦢', v: '💜', w: '🌊', x: '💋', y: '🧸', z: '⚡',
    A: '🍎', B: '🦋', C: '🌙', D: '🌸', E: '🌟', F: '🌺', G: '🍇', H: '🌿', I: '🍦', J: '🎀',
    K: '🦄', L: '🌷', M: '🍄', N: '🌻', O: '🍩', P: '🌈', Q: '👑', R: '🌹', S: '⭐', T: '🌴',
    U: '🦢', V: '💜', W: '🌊', X: '💋', Y: '🧸', Z: '⚡',
  },
  emojiFaces: {
    a: '😀', b: '😊', c: '😎', d: '🤩', e: '😍', f: '🥳', g: '😇', h: '🤗', i: '😏', j: '😜',
    k: '🤪', l: '😋', m: '🥰', n: '😌', o: '🙃', p: '😛', q: '🤔', r: '😂', s: '🤣', t: '😁',
    u: '🙂', v: '😉', w: '😆', x: '🤭', y: '😝', z: '🥴',
    A: '😀', B: '😊', C: '😎', D: '🤩', E: '😍', F: '🥳', G: '😇', H: '🤗', I: '😏', J: '😜',
    K: '🤪', L: '😋', M: '🥰', N: '😌', O: '🙃', P: '😛', Q: '🤔', R: '😂', S: '🤣', T: '😁',
    U: '🙂', V: '😉', W: '😆', X: '🤭', Y: '😝', Z: '🥴',
  },
  emojiAnimals: {
    a: '🐻', b: '🐝', c: '🐱', d: '🐶', e: '🐘', f: '🦊', g: '🦒', h: '🦔', i: '🦎', j: '🐙',
    k: '🦘', l: '🦁', m: '🐵', n: '🦑', o: '🦉', p: '🐼', q: '🦆', r: '🐰', s: '🐍', t: '🐢',
    u: '🦄', v: '🦅', w: '🐋', x: '🦖', y: '🦋', z: '🦓',
    A: '🐻', B: '🐝', C: '🐱', D: '🐶', E: '🐘', F: '🦊', G: '🦒', H: '🦔', I: '🦎', J: '🐙',
    K: '🦘', L: '🦁', M: '🐵', N: '🦑', O: '🦉', P: '🐼', Q: '🦆', R: '🐰', S: '🐍', T: '🐢',
    U: '🦄', V: '🦅', W: '🐋', X: '🦖', Y: '🦋', Z: '🦓',
  },
  emojiFood: {
    a: '🍎', b: '🍌', c: '🍪', d: '🍩', e: '🥚', f: '🍟', g: '🍇', h: '🍯', i: '🍦', j: '🥤',
    k: '🥝', l: '🍋', m: '🍈', n: '🥜', o: '🍊', p: '🍕', q: '🧁', r: '🍚', s: '🍓', t: '🌮',
    u: '🍜', v: '🥗', w: '🍉', x: '🥐', y: '🧀', z: '🌽',
    A: '🍎', B: '🍌', C: '🍪', D: '🍩', E: '🥚', F: '🍟', G: '🍇', H: '🍯', I: '🍦', J: '🥤',
    K: '🥝', L: '🍋', M: '🍈', N: '🥜', O: '🍊', P: '🍕', Q: '🧁', R: '🍚', S: '🍓', T: '🌮',
    U: '🍜', V: '🥗', W: '🍉', X: '🥐', Y: '🧀', Z: '🌽',
  },
  emojiSports: {
    a: '🏹', b: '🏀', c: '🎿', d: '🎯', e: '🏋', f: '⚽', g: '⛳', h: '🏒', i: '🏌', j: '🤺',
    k: '🥋', l: '🏓', m: '🏅', n: '🎾', o: '🏐', p: '🏓', q: '🎱', r: '🚴', s: '🏄', t: '🎾',
    u: '🏆', v: '🏸', w: '🤽', x: '❌', y: '🧘', z: '⚡',
    A: '🏹', B: '🏀', C: '🎿', D: '🎯', E: '🏋', F: '⚽', G: '⛳', H: '🏒', I: '🏌', J: '🤺',
    K: '🥋', L: '🏓', M: '🏅', N: '🎾', O: '🏐', P: '🏓', Q: '🎱', R: '🚴', S: '🏄', T: '🎾',
    U: '🏆', V: '🏸', W: '🤽', X: '❌', Y: '🧘', Z: '⚡',
  },
  emojiNature: {
    a: '🌲', b: '🌼', c: '🌵', d: '🌿', e: '🌍', f: '🌸', g: '🌻', h: '🌺', i: '🍀', j: '🌾',
    k: '🍂', l: '🍃', m: '🍄', n: '🌴', o: '🌙', p: '🌷', q: '🌱', r: '🌹', s: '☀', t: '🌳',
    u: '☂', v: '🌋', w: '🌊', x: '❄', y: '🌈', z: '⚡',
    A: '🌲', B: '🌼', C: '🌵', D: '🌿', E: '🌍', F: '🌸', G: '🌻', H: '🌺', I: '🍀', J: '🌾',
    K: '🍂', L: '🍃', M: '🍄', N: '🌴', O: '🌙', P: '🌷', Q: '🌱', R: '🌹', S: '☀', T: '🌳',
    U: '☂', V: '🌋', W: '🌊', X: '❄', Y: '🌈', Z: '⚡',
  },
};

// Fancy text style names
export const fancyTextStyles = [
  { id: 'bold', name: 'Bold' },
  { id: 'emojiMix', name: '🅰🅱© Emoji Mix' },
  { id: 'italic', name: 'Italic' },
  { id: 'emojiCute', name: '🍎🦋🌙 Emoji Cute' },
  { id: 'boldItalic', name: 'Bold Italic' },
  { id: 'emojiFaces', name: '😀😊😎 Emoji Faces' },
  { id: 'script', name: 'Script' },
  { id: 'emojiAnimals', name: '🐻🦊🐼 Emoji Animals' },
  { id: 'fraktur', name: 'Fraktur' },
  { id: 'emojiFood', name: '🍎🍕🍦 Emoji Food' },
  { id: 'monospace', name: 'Monospace' },
  { id: 'emojiSports', name: '🏀⚽🏆 Emoji Sports' },
  { id: 'doubleStruck', name: 'Double Struck' },
  { id: 'emojiNature', name: '🌲🌸🌊 Emoji Nature' },
  { id: 'circled', name: 'Circled' },
  { id: 'squared', name: 'Squared' },
  { id: 'parenthesized', name: 'Parenthesized' },
  { id: 'fullwidth', name: 'Fullwidth' },
  { id: 'smallCaps', name: 'Small Caps' },
  { id: 'superscript', name: 'Superscript' },
  { id: 'subscript', name: 'Subscript' },
  { id: 'inverted', name: 'Inverted' },
  { id: 'strikethrough', name: 'Strikethrough' },
];

const unicodeDigitMappings: Record<string, string[]> = {
  bold: Array.from({ length: 10 }, (_, i) => String.fromCodePoint(0x1d7ce + i)),
  doubleStruck: Array.from({ length: 10 }, (_, i) => String.fromCodePoint(0x1d7d8 + i)),
  monospace: Array.from({ length: 10 }, (_, i) => String.fromCodePoint(0x1d7f6 + i)),
  fullwidth: Array.from({ length: 10 }, (_, i) => String.fromCodePoint(0xff10 + i)),
  superscript: ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'],
  subscript: ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'],
  circled: ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'],
};

// Convert text to fancy style
export function convertToFancyText(text: string, styleId: string): string {
  const mapping = unicodeMappings[styleId];
  if (!mapping) return text;

  const digitMapping = unicodeDigitMappings[styleId];
  const converted = Array.from(text).map((char) => {
    if (mapping[char]) return mapping[char];
    if (digitMapping && /^[0-9]$/.test(char)) {
      return digitMapping[Number(char)];
    }
    return char;
  });

  return styleId === 'inverted'
    ? converted.reverse().join('')
    : converted.join('');
}

// Generate all fancy text variants
export function generateAllFancyVariants(text: string): { id: string; name: string; text: string }[] {
  return fancyTextStyles.map(style => ({
    id: style.id,
    name: style.name,
    text: convertToFancyText(text, style.id),
  }));
}

// Logo font styles
export const logoFontStyles: LogoStyle[] = [
  { id: 'modern-sans', name: 'Modern Sans', fontFamily: 'system-ui', style: { fontWeight: 700, letterSpacing: '-0.02em' } },
  { id: 'elegant-serif', name: 'Elegant Serif', fontFamily: 'Georgia', style: { fontWeight: 400, fontStyle: 'italic' } },
  { id: 'bold-display', name: 'Bold Display', fontFamily: 'Impact', style: { fontWeight: 900, textTransform: 'uppercase' as const } },
  { id: 'minimal-thin', name: 'Minimal Thin', fontFamily: 'system-ui', style: { fontWeight: 200, letterSpacing: '0.2em' } },
  { id: 'tech-mono', name: 'Tech Mono', fontFamily: 'monospace', style: { fontWeight: 500 } },
  { id: 'classic-serif', name: 'Classic Serif', fontFamily: 'Times New Roman', style: { fontWeight: 700 } },
  { id: 'rounded-friendly', name: 'Rounded Friendly', fontFamily: 'system-ui', style: { fontWeight: 600, letterSpacing: '0.05em' } },
  { id: 'condensed-bold', name: 'Condensed Bold', fontFamily: 'Arial Narrow', style: { fontWeight: 700, letterSpacing: '-0.03em' } },
  { id: 'script-elegant', name: 'Script Elegant', fontFamily: 'cursive', style: { fontWeight: 400 } },
  { id: 'geometric-clean', name: 'Geometric Clean', fontFamily: 'Verdana', style: { fontWeight: 500, letterSpacing: '0.1em' } },
  { id: 'vintage-display', name: 'Vintage Display', fontFamily: 'Georgia', style: { fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const } },
  { id: 'futuristic', name: 'Futuristic', fontFamily: 'system-ui', style: { fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase' as const } },
];

// Generate logo styles for a brand name
export function generateLogoStyles(brandName: string): { style: LogoStyle; preview: string }[] {
  return logoFontStyles.map(style => ({
    style,
    preview: brandName || 'Brand',
  }));
}

// Tools list for sidebar
export const tools = [
  { id: 'fancy-text', name: 'Fancy Text Generator', href: '/', icon: '🎨' },
];

// Category page data for navigation
export const categories = [
  { id: 'styles', name: 'Text Styles', href: '/styles', icon: '🎨' },
  { id: 'fandom', name: 'Fandom Styles', href: '/fandom', icon: '⭐' },
  { id: 'guides', name: 'Guides', href: '/guides', icon: '📖' },
];
