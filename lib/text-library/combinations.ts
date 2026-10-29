import type { LibraryItem } from './catalog';

// Editorial selections and suggested uses; no competitor corpus or user submissions.
// Names describe a suggested mood, not a universal meaning or an emoji translation.
function collection(family: string, groups: [string, [string, string][]][]): LibraryItem[] {
  return groups.flatMap(([category, rows]) => rows.map(([name, text]) => ({
    id: `${family}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, text, category,
    tags: [category.toLowerCase(), family, name.toLowerCase()], family,
  })));
}

export const kaomojiItems = collection('kaomoji', [
  ['Happy', [
    ['Bright smile', '(^‿^)'], ['Cheerful eyes', '(＾▽＾)'], ['Big grin', '(≧▽≦)'], ['Simple smile', '(^_^)'],
    ['Little delight', '(´▽`)'], ['Beaming', '(⌒▽⌒)'], ['Happy cheeks', '(o^▽^o)'], ['Sunny mood', '(*^▽^*)'],
    ['Joyful face', '(✯◡✯)'], ['Quiet happiness', '(˘◡˘)'],
  ]],
  ['Love', [
    ['Heart eyes', '(♡‿♡)'], ['Sweet smile', '(´♡‿♡`)'], ['Blowing a kiss', '( ˘ ³˘)♥'], ['Love letter', '(｡♥‿♥｡)'],
    ['Warm affection', '(ღ˘⌣˘ღ)'], ['Heart hands', '(づ￣ ³￣)づ'], ['Tiny kiss', '(っ˘з(˘⌣˘ )'], ['Adoring', '(♥ω♥*)'],
    ['Soft heart', '(♡˙︶˙♡)'], ['Feeling loved', '(´｡• ᵕ •｡`) ♡'],
  ]],
  ['Shy', [
    ['Small blush', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)'], ['Bashful smile', '(〃▽〃)'], ['Awkward laugh', '(^_^;)'], ['Looking away', '(*/ω＼*)'],
    ['Hidden smile', '(*/▽＼*)'], ['Shy cheeks', '(〃ω〃)'], ['A little nervous', '(・・;)'], ['Soft blush', '(⸝⸝ᵕᴗᵕ⸝⸝)'],
    ['Peeking out', '|ω・)'], ['Embarrassed grin', '(￣▽￣*)ゞ'],
  ]],
  ['Sad', [
    ['Tears', '(T_T)'], ['Quiet crying', '(；ω；)'], ['Big tears', '(╥﹏╥)'], ['Downcast', '(｡•́︿•̀｡)'],
    ['Disappointed', '(´･_･`)'], ['Rainy mood', '(︶︹︺)'], ['Feeling blue', '(っ- ‸ - ς)'], ['Wobbly smile', '(ಥ_ಥ)'],
    ['A small sob', '(ノ_<。)'], ['Need a moment', '(´；д；`)'],
  ]],
  ['Surprised', [
    ['Wide eyes', '(⊙_⊙)'], ['What happened', '(°ロ°)'], ['Sudden surprise', 'Σ(°△°|||)'], ['Amazed', '(✧o✧)'],
    ['Speechless', '(゜-゜)'], ['Double take', '(O_O)'], ['Oh wow', '(ﾉﾟ0ﾟ)ﾉ'], ['Startled', 'Σ(ﾟДﾟ)'],
    ['Unexpected', '(・o・)'], ['Tiny gasp', '(°◇°)'],
  ]],
  ['Thinking', [
    ['Considering', '(¬_¬)'], ['Not sure', '(・・?)'], ['Hmm', '(￢_￢)'], ['Questioning', '(・_・ヾ'],
    ['Puzzled', '(´･ω･`)?'], ['Lost in thought', '(￣～￣;)'], ['Let me think', '( ˘･з･)'], ['Skeptical', '(눈_눈)'],
    ['Curious glance', '(￢‿￢ )'], ['Searching memory', '(；￣Д￣)'],
  ]],
  ['Animals', [
    ['Cat smile', '(=^･ω･^=)'], ['Little cat', '(=^･^=)'], ['Cat paws', '(=①ω①=)'], ['Bear hello', 'ʕ•ᴥ•ʔ'],
    ['Bear arms', 'ʕっ•ᴥ•ʔっ'], ['Bunny', '(・×・)'], ['Dog face', 'U・ᴥ・U'], ['Little bird', '(•ө•)'],
    ['Owl eyes', '(O v O)'], ['Sleepy cat', '(=￣ω￣=)'],
  ]],
  ['Greetings', [
    ['Hello wave', '(^_^)/'], ['Happy wave', '(＾▽＾)/'], ['Goodbye', '(´ー`)/~~'], ['Friendly greeting', '(・ω・)ノ'],
    ['A little salute', '(￣^￣)ゞ'], ['Welcome', 'ヽ(・∀・)ﾉ'], ['Good morning', '(o´ω`o)ﾉ'], ['High five', '( ^^)人(^^ )'],
    ['Over here', 'ヾ(・ω・*)'], ['See you soon', '(⌒▽⌒)ノ'],
  ]],
  ['Actions', [
    ['Open hug', '(づ｡◕‿‿◕｡)づ'], ['Tiny dance', '♪┏(・o･)┛♪'], ['Celebration', 'ヽ(>∀<☆)ノ'], ['You can do it', '(ง •̀_•́)ง'],
    ['Table flip', '(╯°□°)╯︵ ┻━┻'], ['Put it back', '┬─┬ノ( º _ ºノ)'], ['Shrug', '¯\\_(ツ)_/¯'], ['Ready to run', 'ε=ε=┌( >_<)┘'],
    ['Taking notes', 'φ(．．)'], ['Applause', '(ﾉ´ヮ`)ﾉ*: ･ﾟ'],
  ]],
  ['Sleepy', [
    ['Dozing', '(－_－) zzZ'], ['Sleepy eyes', '(－ω－)'], ['Good night', '(ᴗ˳ᴗ)'], ['Time to rest', '(∪｡∪)｡｡｡zzZ'],
    ['Very tired', '(￣o￣) . z Z'], ['Small yawn', '(´O`)'], ['Resting', '(˘ω˘)'], ['Bedtime', '(＿ ＿*) Z z z'],
    ['Drowsy smile', '(´～`)'], ['Dreaming', '(ᵕᴗᵕ) ♡'],
  ]],
]);

export const emojiComboItems = collection('combo', [
  ['Cozy', [
    ['Quiet morning', '☕ 📖 🌤️'], ['Rainy reading', '🌧️ 📚 🕯️'], ['Warm evening', '🧶 🫖 🧦'], ['Movie night', '🎬 🍿 🛋️'],
    ['Tea break', '🍵 🍪 🌿'], ['Slow Sunday', '🥐 ☕ 📰'], ['Candlelight', '🕯️ 🌙 🤎'], ['Baking day', '🥣 🍞 🧈'],
    ['Window seat', '🪟 🌧️ ☕'], ['Soft blanket', '🧸 🛏️ ☁️'],
  ]],
  ['Nature', [
    ['Forest walk', '🌲 🍄 🍃'], ['Spring garden', '🌷 🐝 🌱'], ['Mountain air', '🏔️ 🌲 🥾'], ['Wildflowers', '🌼 🦋 🌾'],
    ['Fresh rain', '🌧️ 🌿 💧'], ['Sunlit leaves', '☀️ 🍃 🌳'], ['Desert sunset', '🌵 🏜️ 🌅'], ['Mushroom hunt', '🍄 🧺 🌲'],
    ['Little garden', '🪴 🌱 🐞'], ['River day', '🏞️ 🪨 🌿'],
  ]],
  ['Love', [
    ['Little love note', '💌 🌷 🤍'], ['Sweet date', '🌹 🍰 🕯️'], ['Thinking of you', '💭 💕 🌙'], ['Warm hug', '🧸 🤎 🫶'],
    ['Flower delivery', '💐 🎀 💌'], ['Shared coffee', '☕ ☕ ❤️'], ['Pink romance', '💕 🌸 🎀'], ['Golden affection', '💛 🌻 ✨'],
    ['Anniversary', '🥂 🌹 💍'], ['Heartfelt thanks', '🫶 💐 💖'],
  ]],
  ['Night sky', [
    ['Moonlight', '🌙 ☁️ ✨'], ['Stargazing', '🔭 🌌 ⭐'], ['A wish', '🌠 💫 🤍'], ['Midnight thoughts', '🌃 💭 🌙'],
    ['Space trip', '🚀 🪐 🌌'], ['Blue night', '🌙 💙 🌊'], ['Dream journal', '📓 🌙 🖊️'], ['Northern lights', '🌌 ❄️ 🏔️'],
    ['Sleep well', '🛏️ 💤 🌙'], ['Cosmic sparkle', '🪐 ⭐ 💫'],
  ]],
  ['Travel', [
    ['Ready to fly', '🧳 ✈️ 🌍'], ['Road trip', '🚗 🗺️ 🎶'], ['Train window', '🚆 🪟 🌄'], ['City weekend', '🏙️ 📷 ☕'],
    ['Camping', '⛺ 🔥 🌲'], ['Island holiday', '🏝️ 🥥 🌊'], ['Postcard home', '📮 💌 🌍'], ['Exploring streets', '🗺️ 🚶 📸'],
    ['Sailing away', '⛵ 🌊 ☀️'], ['Passport ready', '🛂 🧳 ✈️'],
  ]],
  ['Celebration', [
    ['Happy birthday', '🎂 🎈 🎉'], ['Congratulations', '🥳 🎊 🏆'], ['New beginning', '🌅 🌱 ✨'], ['Party time', '🪩 🎶 🎉'],
    ['Graduation day', '🎓 📚 🎊'], ['Wrapped surprise', '🎁 🎀 ✨'], ['Cheers', '🥂 🍾 🎉'], ['Big achievement', '🏅 💪 ⭐'],
    ['Wedding day', '💍 💐 🕊️'], ['New year', '🎆 🕛 🥂'],
  ]],
  ['Study and create', [
    ['Study session', '📚 ✏️ ☕'], ['Fresh notebook', '📓 🖊️ ✨'], ['Art afternoon', '🎨 🖌️ 🌈'], ['Writing time', '⌨️ 📝 💭'],
    ['Music practice', '🎹 🎼 🎶'], ['Design ideas', '💡 🎨 📐'], ['Focus mode', '🎧 💻 ☕'], ['Photography walk', '📷 🌇 🚶'],
    ['Craft table', '✂️ 🧵 🎀'], ['Finished project', '✅ 📁 🎉'],
  ]],
  ['Food', [
    ['Strawberry picnic', '🍓 🧺 🌼'], ['Pizza evening', '🍕 🥤 🎬'], ['Breakfast', '🥞 🍯 ☕'], ['Sweet treat', '🧁 🍒 🎀'],
    ['Sushi lunch', '🍣 🥢 🍵'], ['Ice cream stop', '🍦 ☀️ 🍒'], ['Fresh lemonade', '🍋 🧊 🌿'], ['Pasta night', '🍝 🍅 🌿'],
    ['Market basket', '🥕 🍎 🧺'], ['Chocolate break', '🍫 ☕ 🤎'],
  ]],
  ['Seasons', [
    ['Spring bloom', '🌸 🌱 🦋'], ['Summer sunshine', '☀️ 🍉 🕶️'], ['Autumn leaves', '🍂 🍁 🧣'], ['Winter snow', '❄️ ⛄ 🧤'],
    ['Pumpkin season', '🎃 🍂 🕯️'], ['Festive lights', '🎄 🎁 ✨'], ['First blossom', '🌷 🌦️ 🌱'], ['Beach weather', '🏖️ 🩴 ☀️'],
    ['Apple picking', '🍎 🧺 🍁'], ['Snow day', '🛷 ❄️ ☕'],
  ]],
  ['Ocean', [
    ['Shell collecting', '🐚 🌊 🧺'], ['Beach sunset', '🌅 🌊 🧡'], ['Underwater', '🪸 🐠 🫧'], ['Sea breeze', '🌊 🍃 🤍'],
    ['Surf morning', '🏄 🌊 ☀️'], ['Sandy toes', '🏖️ 🐚 👣'], ['Blue horizon', '⛵ 💙 🌊'], ['Rock pool', '🦀 🪨 🐚'],
    ['Ocean friends', '🐬 🐢 🌊'], ['Tropical water', '🏝️ 🐠 🥥'],
  ]],
]);
