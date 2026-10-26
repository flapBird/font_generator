import twitterText from 'twitter-text';

export function styleSocialText(text: string, transform: (text: string) => string) {
  const entities = twitterText.extractEntitiesWithIndices(text).sort((a, b) => a.indices[0] - b.indices[0]);
  let cursor = 0;
  let output = '';
  for (const { indices: [start, end] } of entities) {
    if (start < cursor) continue;
    output += transform(text.slice(cursor, start)) + text.slice(start, end);
    cursor = end;
  }
  return output + transform(text.slice(cursor));
}

export const xPostLength = (text: string) => twitterText.parseTweet(text).weightedLength;

export const petFrames = {
  none: { label: 'No frame', before: '', after: '' },
  hearts: { label: 'Hearts', before: '♡ ', after: ' ♡' },
  stars: { label: 'Stars', before: '✦ ', after: ' ✦' },
  brackets: { label: 'Brackets', before: '「', after: '」' },
} as const;

export type PetFrame = keyof typeof petFrames;
export function framePetName(text: string, frame: PetFrame = 'none') {
  if (!text.trim()) return '';
  const { before, after } = petFrames[frame];
  return text.split(/(\r?\n)/).map((line) => line.trim() ? `${before}${line}${after}` : line).join('');
}

export interface PlatformTextConfig {
  label: string;
  intro: string;
  destinations: { id: string; label: string; note: string }[];
  sources: { title: string; url: string }[];
}

export const platformTextConfigs: Record<string, PlatformTextConfig> = {
  'twitter-font-generator': {
    label: 'Twitter / X',
    intro: 'Create copyable styles for posts, bios, and display names. Your @handle stays ordinary text.',
    destinations: [
      { id: 'post', label: 'Post', note: 'Estimates use twitter-text for a standard 280-character post, including weighted Unicode, emoji, and detected URLs. Check the final X composer; longer-post subscriptions and reply context are not modeled.' },
      { id: 'bio', label: 'Bio', note: 'X bios have a 160-character limit. Keep essential information readable and check the final profile field; the post counter does not apply to bios.' },
      { id: 'name', label: 'Display name', note: 'Display names can be up to 50 characters. Decorative characters cannot be used in your @username. Confirm acceptance and length in X before saving.' },
    ],
    sources: [
      { title: 'X name and username rules', url: 'https://help.x.com/en/managing-your-account/change-x-handle' },
      { title: 'X character counting', url: 'https://docs.x.com/fundamentals/counting-characters' },
    ],
  },
  'roblox-font-generator': {
    label: 'Roblox',
    intro: 'Try Unicode text for experience labels, descriptions, and fan profiles. This is not a Roblox logo maker or an official font download.',
    destinations: [
      { id: 'experience', label: 'In-experience text', note: 'Each Roblox experience controls its own fields and filtering. A browser preview cannot certify that a label, roleplay name, or message will be accepted.' },
      { id: 'profile', label: 'Profile & descriptions', note: 'Paste a short result into the intended description field and preview it. Roblox can filter or reject characters; keep a plain-text fallback.' },
      { id: 'name', label: 'Account names', note: 'Roblox display names and usernames have separate rules. Unicode styles shown here are not verified as valid account names. Use the original text if a styled result is rejected.' },
    ],
    sources: [
      { title: 'Roblox display names', url: 'https://en.help.roblox.com/hc/en-us/articles/4401938870292-Changing-Your-Display-Name' },
      { title: 'Roblox text filtering', url: 'https://create.roblox.com/docs/ui/text-input#text-filtering' },
    ],
  },
  'twitch-font-generator': {
    label: 'Twitch',
    intro: 'Make readable text accents for stream titles, bios, and chat. These are Unicode characters, not Twitch’s logo or interface font.',
    destinations: [
      { id: 'title', label: 'Stream title', note: 'Style a short phrase, then check the title in Twitch. Keep game names, categories, and important search terms in ordinary letters.' },
      { id: 'bio', label: 'Bio & panels', note: 'Use a small decorative accent in an editable text field. For panel graphics or overlays, use an artwork generator instead; copied Unicode does not install a streaming font.' },
      { id: 'chat', label: 'Chat', note: 'Channel rules and moderation bots may restrict unusual characters. Avoid long decorative messages, and keep commands and mentions in ordinary text.' },
    ],
    sources: [{ title: 'Twitch display-name rules', url: 'https://help.twitch.tv/s/article/display-names-on-twitch?language=en_US' }],
  },
  'adopt-me-font-generator': {
    label: 'Adopt Me',
    intro: 'Style a pet name or short roleplay label, then add an optional frame. Try it in the game before saving.',
    destinations: [
      { id: 'pet', label: 'Pet name', note: 'These are pet-name ideas, not verified in-game results. Roblox and Adopt Me may filter letters or symbols, replace them with boxes, or reject the name. Try no frame or copy the original if needed.' },
      { id: 'profile', label: 'Roleplay & profile text', note: 'Use short readable labels in fields the experience makes editable. This tool cannot change your Roblox account username or the game’s interface.' },
    ],
    sources: [{ title: 'Roblox text filtering', url: 'https://create.roblox.com/docs/ui/text-input#text-filtering' }],
  },
};
