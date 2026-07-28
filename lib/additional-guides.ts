import type { PageDefinition } from './data';

export const additionalGuidePages: PageDefinition[] = [
  {
    slug: 'unicode-font-compatibility-guide',
    title: 'Unicode Font Compatibility: Why Fancy Text Looks Different',
    metaTitle: 'Unicode Font Compatibility Guide',
    metaDescription: 'Learn why fancy Unicode text changes across phones, browsers, and apps, plus a practical compatibility testing workflow.',
    category: 'guides',
    description: 'A practical guide to font fallback, missing glyphs, device differences, and testing fancy text before publishing it.',
    content: `Fancy text is portable because it uses Unicode characters, but portable does not mean visually identical. A copied character keeps the same codepoint when it moves between apps. The shape you see is supplied by a font on the receiving device, and that font may not be the one used on the device where the text was created.

**Codepoints stay stable; glyphs can change.** A mathematical bold letter remains the same Unicode character after copy and paste. On an iPhone it may be drawn by one system font, while Android, Windows, a game client, or a social app may choose another fallback font. Stroke width, spacing, baseline alignment, and the size of symbols can therefore vary even though the underlying text is unchanged.

**Missing glyphs cause boxes.** When none of the available fonts contains a drawing for a codepoint, the system displays an empty square, question mark, or replacement symbol. Core mathematical alphabets usually have broad coverage. Rare combining marks, enclosed characters, and unusual symbols are more likely to trigger fallback problems.

**Mixed fallback is common.** One word can be assembled from several fonts. A script alphabet may cover the letters but not the punctuation or emoji beside them. The result can look uneven because each fallback font has different proportions. This is why a decorative frame that looks balanced in one browser may appear taller or wider somewhere else.

**Use a three-step compatibility check.** First, confirm that every important letter and number converted. Second, paste the result into the exact profile field, caption box, game client, or document where it will be used. Third, view it on at least one other operating system or ask another person to check it. Keep the plain-text original so you can replace a style quickly if a platform filters it.

For essential information, choose bold, italic, monospace, or small caps before heavily combined effects. Decorative Unicode works best for short display text; ordinary characters remain the safest option for instructions, contact details, and longer paragraphs.`,
    howToUse: 'Generate a short sample, paste it into the exact destination field, and compare it on a second device before updating an important profile or public title.',
    examples: [
      { before: 'Profile Name', after: '𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐍𝐚𝐦𝐞', note: 'Mathematical bold usually has broad fallback coverage' },
      { before: 'Status', after: 'Ṡṫȧṫu̇ṡ', note: 'Combining marks are more likely to shift between fonts' },
      { before: 'Launch 2026', after: '𝙻𝚊𝚞𝚗𝚌𝚑 𝟸𝟶𝟸𝟼', note: 'Check that letters and digits use compatible sets' },
    ],
    faq: [
      { q: 'Why does fancy text look different on another phone?', a: 'The Unicode codepoints are the same, but each device can draw them with a different installed or fallback font.' },
      { q: 'Why do I see empty squares?', a: 'The app or device could not find a font containing a glyph for one or more of the Unicode characters.' },
      { q: 'Which fancy styles are safest?', a: 'Core mathematical bold, italic, monospace, and simple small-cap characters generally have broader support than rare symbols or stacked combining effects.' },
    ],
    relatedSlugs: ['unicode-character-coverage-guide', 'fancy-text-troubleshooting-guide', 'accessible-fancy-text-guide'],
    icon: '🧩',
  },
  {
    slug: 'accessible-fancy-text-guide',
    title: 'Accessible Fancy Text: Screen Readers, Search, and Readability',
    metaTitle: 'Accessible Fancy Text Guide',
    metaDescription: 'Use fancy Unicode text more accessibly with guidance for screen readers, search, copying, contrast, and readable social profiles.',
    category: 'guides',
    description: 'How to keep decorative Unicode useful without making important information difficult to read, search, or hear.',
    content: `Fancy Unicode can create a strong visual accent, but it is not equivalent to applying bold or italic formatting. Many decorative characters have technical names such as “mathematical bold small a.” A screen reader may announce that full name instead of reading the intended word naturally.

**Keep essential meaning in ordinary text.** Contact details, instructions, safety information, prices, dates, and primary navigation should remain in regular characters. If a decorative heading contains important information, repeat the meaning in ordinary text nearby. This gives assistive technology and users with limited font support a reliable version.

**Use short decorative phrases.** A one- or two-word profile accent is easier to interpret than a full paragraph of script or fraktur characters. Long styled passages increase listening time for screen-reader users and reduce scanning speed for everyone. They can also make spelling, selecting, and editing more difficult.

**Search and moderation systems may treat characters literally.** A visual “A” from the Mathematical Alphanumeric block is not the same codepoint as the ordinary letter A. Search, username matching, automated moderation, and form validation may therefore behave differently. Do not replace important keywords or account recovery information with decorative equivalents.

**Visual accessibility still matters.** Choose styles with open letterforms, adequate spacing, and clear punctuation. Avoid stacking several combining marks because they can overlap nearby lines. Test at mobile size and in both light and dark interfaces. If characters become ambiguous when small, switch to bold or small caps.

**Offer a plain-text fallback.** Save the original phrase and consider placing it in an accessible label, description, or nearby sentence when publishing content you control. On social platforms where you cannot add semantic markup, keep the display name readable and use decoration only for a secondary line.

Decorative text is most successful when it adds personality without carrying the entire message. Treat it like an accent: intentional, limited, and easy to replace when a device or assistive technology cannot present it clearly.`,
    howToUse: 'Limit decoration to a short phrase, preserve the plain-text original, and check how the result sounds with a screen reader or text-to-speech feature.',
    examples: [
      { before: 'Support: contact@example.com', after: 'Support: contact@example.com', note: 'Keep contact information in ordinary text' },
      { before: 'Creative Designer', after: '𝒞𝓇ℯ𝒶𝓉𝒾𝓋ℯ Designer', note: 'Decorate one part instead of the full profile' },
      { before: 'Important update', after: '𝐈𝐦𝐩𝐨𝐫𝐭𝐚𝐧𝐭 update', note: 'A short bold accent is easier to scan' },
    ],
    faq: [
      { q: 'Can screen readers understand fancy text?', a: 'Some can identify the characters, but they may announce long Unicode names or read the result awkwardly. Important text should have a plain-text version.' },
      { q: 'Does fancy text affect search?', a: 'It can. Styled Unicode letters are different codepoints, so exact matching, search, and moderation systems may not treat them like ordinary letters.' },
      { q: 'Is bold Unicode accessible?', a: 'It is usually more legible than ornate styles, but it is still a character substitution rather than semantic bold formatting and may be announced differently.' },
    ],
    relatedSlugs: ['unicode-font-compatibility-guide', 'fancy-text-troubleshooting-guide', 'how-unicode-text-works-guide'],
    icon: '♿',
  },
  {
    slug: 'instagram-bio-font-guide',
    title: 'How to Choose Fancy Text for an Instagram Bio',
    metaTitle: 'Instagram Bio Fancy Text Guide',
    metaDescription: 'Choose readable fancy text for an Instagram bio, name, and profile labels with practical Unicode compatibility and accessibility tips.',
    category: 'guides',
    description: 'A practical workflow for styling an Instagram bio while keeping the profile readable, searchable, and easy to update.',
    content: `An Instagram bio has limited space and is usually read on a small screen. The best fancy text is not necessarily the most decorative output in the generator. It is the style that communicates a profile’s tone without hiding the name, role, location, or contact information visitors need.

**Start with the job of each line.** Keep the account name and important search terms in ordinary characters when discoverability matters. Use decorative Unicode for a short descriptor, divider, campaign phrase, or visual accent. A readable structure might use a normal name, a short bold role, and ordinary contact or link information.

**Match style to message.** Bold and bold italic work for concise professional labels. Script can suit a personal, beauty, wedding, or creative profile when used for one short phrase. Fullwidth and monospace create a digital or retro mood but consume more visual space. Circled and framed styles are better as occasional accents than as a complete bio.

**Check every character.** Some Unicode sets have incomplete lowercase or number coverage. A result can quietly mix styled and ordinary letters when a character is missing. Pay particular attention to numbers, punctuation, accented names, and non-English text. If the alphabet is incomplete, choose a simpler style instead of accepting an uneven result.

**Paste into the real field before deciding.** Instagram can change field validation and rendering independently of the generator. Test the display name and bio separately because platform rules may differ. View the saved profile on another phone and confirm that line breaks, emoji, and decorative symbols did not create unexpected wrapping.

**Keep the profile maintainable.** Store a plain-text copy of the bio. Decorative characters are slower to edit and can be difficult to search or dictate. When a promotion, role, or contact detail changes, rebuilding the entire bio from scratch increases the chance of a typo.

The strongest profile usually uses one visual idea consistently. A single script phrase or bold label looks intentional; five unrelated styles compete with the message and can make the account appear less trustworthy.`,
    howToUse: 'Draft the bio in plain text, choose one short phrase to style, paste it into Instagram, and check the saved profile from a second device.',
    examples: [
      { before: 'Photographer | Shanghai', after: '𝐏𝐡𝐨𝐭𝐨𝐠𝐫𝐚𝐩𝐡𝐞𝐫 | Shanghai', note: 'Keep the location easy to read and search' },
      { before: 'New collection', after: '𝒩ℯ𝓌 collection', note: 'Use script as a short accent' },
      { before: 'Open daily 10–6', after: 'Open daily 10–6', note: 'Keep operational details in ordinary characters' },
    ],
    faq: [
      { q: 'Should I style my Instagram name?', a: 'If name search matters, keep the core name in ordinary characters and style a secondary phrase or role instead.' },
      { q: 'Why does my bio wrap differently?', a: 'Fullwidth characters, emoji, and fallback fonts use different widths. Always test the final text in the actual profile.' },
      { q: 'How many fancy styles should a bio use?', a: 'One main decorative style is usually enough. A consistent accent is easier to read than several unrelated alphabets.' },
    ],
    relatedSlugs: ['accessible-fancy-text-guide', 'unicode-font-compatibility-guide', 'fancy-text-troubleshooting-guide'],
    icon: '📱',
  },
  {
    slug: 'discord-font-guide',
    title: 'Fancy Text for Discord Names, Channels, and Messages',
    metaTitle: 'Discord Fancy Text Guide',
    metaDescription: 'Use fancy Unicode text in Discord display names, channel labels, server descriptions, and messages without hurting readability.',
    category: 'guides',
    description: 'Where decorative Unicode works in Discord, where Markdown is better, and how to avoid unreadable server navigation.',
    content: `Discord offers two different ways to change how text looks: Markdown formatting and Unicode character substitution. Markdown is usually the better choice inside messages because it preserves ordinary letters and adds semantic formatting such as bold, italic, code, or headings. Fancy Unicode is most useful where Markdown is not available or where a short display label needs a distinct visual tone.

**Display names and server descriptions.** A short bold, monospace, or small-cap phrase can make a role or community theme recognizable. Keep the searchable part of a name readable. Excessively decorated names are harder to mention, moderate, type on mobile, and distinguish from impersonation attempts.

**Channel navigation should prioritize clarity.** Channel labels are interface elements. A small symbol or consistent prefix can improve grouping, but a full channel list written in ornate script slows navigation. Use ordinary words for essential destinations such as rules, announcements, support, and safety information.

**Use Markdown inside conversation.** For emphasis in a message, Discord’s native bold, italic, lists, block quotes, and code formatting are more accessible than replacing every letter with a Unicode lookalike. Unicode remains useful for a compact signature, decorative event title, or themed divider that would not be supported by Markdown alone.

**Watch for moderation and compatibility issues.** Similar-looking Unicode characters can make names difficult to verify. Server owners may restrict particular symbols, and bots can normalize or reject unusual text. Test the result with moderation bots, mobile clients, and the permission level that will actually use it.

**Create a consistent server system.** Choose one prefix style for category labels, one readable convention for staff roles, and plain language for help channels. Consistency communicates quality more effectively than assigning a different alphabet to every channel.

If a copied result is rejected, shorten it, remove combining marks, and try a core bold or monospace alphabet. The limitation may come from the specific Discord field, a server bot, or an operating-system font rather than the generator itself.`,
    howToUse: 'Choose a short name or label, test it in the exact Discord field, then check mentions, mobile rendering, and moderation-bot behavior.',
    examples: [
      { before: 'ANNOUNCEMENTS', after: 'ᴀɴɴᴏᴜɴᴄᴇᴍᴇɴᴛs', note: 'Small caps can work for a short category label' },
      { before: 'Developer', after: '𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛', note: 'Monospace fits a technical role' },
      { before: 'rules-and-safety', after: 'rules-and-safety', note: 'Keep essential navigation plain and obvious' },
    ],
    faq: [
      { q: 'Is Unicode text the same as Discord Markdown?', a: 'No. Markdown formats ordinary characters inside Discord, while a fancy text generator substitutes different Unicode characters.' },
      { q: 'Can bots reject fancy names?', a: 'Yes. Moderation or verification bots may normalize, filter, or reject unusual characters depending on the server configuration.' },
      { q: 'Which style is easiest to read?', a: 'Simple bold, monospace, and restrained small caps are generally easier to scan than script, fraktur, or stacked combining effects.' },
    ],
    relatedSlugs: ['accessible-fancy-text-guide', 'unicode-font-compatibility-guide', 'fancy-text-troubleshooting-guide'],
    icon: '💬',
  },
  {
    slug: 'fancy-text-troubleshooting-guide',
    title: 'Fancy Text Not Working? A Copy-and-Paste Troubleshooting Guide',
    metaTitle: 'Fancy Text Troubleshooting Guide',
    metaDescription: 'Fix missing letters, boxes, rejected usernames, reversed text, broken accents, and copy-paste problems with fancy Unicode.',
    category: 'guides',
    description: 'A symptom-by-symptom guide for diagnosing Unicode text that looks wrong, disappears, or gets rejected.',
    content: `When fancy text fails, the generator is only one possible cause. The output can also be affected by incomplete Unicode alphabets, the fonts installed on a device, validation rules in the destination field, clipboard behavior, moderation filters, and combining marks that render differently across line heights.

**Some letters stayed normal.** The selected style probably does not contain an equivalent for every character. This is common with superscript, subscript, turned letters, accented characters, and some numeral sets. Try a core bold, italic, monospace, or small-cap result with broader coverage.

**The text became boxes or question marks.** The receiving device could not find a font with those glyphs. Confirm the same text in a modern browser. If it works there but not in a specific app, use a simpler Unicode block or remove rare symbols and combining effects.

**A username or profile field rejects the text.** Platforms can restrict character categories, length, invisible marks, or lookalike symbols. Remove frames and combining marks first, then try letters only. A result that works in a post may still be rejected in a username because those fields use different rules.

**Upside-down text looks incorrectly ordered.** A convincing 180-degree effect normally transforms the letters and reverses their order. If the destination applies right-to-left behavior or automatic normalization, punctuation may move. Shorten the phrase and compare the copied codepoints before adding symbols.

**Accents overlap nearby lines.** Glitch, underline, overline, dotted, and zalgo-like styles use combining marks. Fonts position those marks differently, and tight line heights can cause collisions. Reduce the number of marks, add line spacing where you control the design, or use an enclosed style instead.

**Copy does nothing.** Clipboard permission may be blocked in an embedded browser or privacy mode. Select the displayed result manually and use the operating system’s copy command. Avoid copying the style name or button label with the output.

Troubleshooting works fastest when you simplify one layer at a time: remove surrounding symbols, remove combining marks, switch to a core alphabet, and finally test ordinary text. This identifies whether the problem comes from the chosen style or the destination itself.`,
    howToUse: 'Match your symptom to the sections above, simplify the result one layer at a time, and retest in the destination after every change.',
    examples: [
      { before: 'Missing: qₓ', after: 'Try: ǫx', note: 'Switch to a set with better character coverage' },
      { before: 'H̴e̷l̸l̵o̶', after: '𝐇𝐞𝐥𝐥𝐨', note: 'Replace stacked marks with a core alphabet' },
      { before: '【 𝓗𝓮𝓵𝓵𝓸 】', after: '𝓗𝓮𝓵𝓵𝓸', note: 'Remove frames when a field rejects symbols' },
    ],
    faq: [
      { q: 'Why do some letters not change?', a: 'Not every Unicode style contains every letter, number, accent, or punctuation mark, so the generator keeps unsupported characters readable.' },
      { q: 'Why does text work in a browser but not an app?', a: 'The app may use a different fallback font or apply stricter validation and moderation rules.' },
      { q: 'Can I repair a missing Unicode character?', a: 'You cannot create a missing codepoint. Choose another style with broader coverage or keep that character in ordinary text.' },
    ],
    relatedSlugs: ['unicode-character-coverage-guide', 'unicode-font-compatibility-guide', 'accessible-fancy-text-guide'],
    icon: '🛠️',
  },
  {
    slug: 'unicode-character-coverage-guide',
    title: 'Unicode Character Coverage for Fancy Text Styles',
    metaTitle: 'Fancy Text Character Coverage Guide',
    metaDescription: 'Compare letter, number, punctuation, accent, superscript, subscript, and symbol coverage before choosing a fancy Unicode style.',
    category: 'guides',
    description: 'Why some alphabets are complete, others have gaps, and how to choose a style that covers the characters your text needs.',
    content: `A fancy text style is only useful when it covers the characters in the message. Unicode was not designed as a collection of social-media fonts. Its styled alphabets were added for mathematical notation, phonetics, enclosed labels, compatibility with older standards, and many other technical purposes. Coverage therefore varies by block.

**Mathematical alphabets are the most complete.** Bold, italic, bold italic, script, fraktur, double-struck, sans-serif, and monospace sets cover most basic Latin uppercase and lowercase letters. Several include matching digits, but not every alphabet has its own numerals. A generator must preserve an ordinary digit when no honest styled equivalent exists.

**Superscript and subscript are incomplete by design.** These characters were introduced as needed for phonetics, formulas, abbreviations, and compatibility. Superscript has broader lowercase and numeral coverage than subscript, but neither is a complete parallel alphabet. Mixed output is expected when a letter has no assigned codepoint.

**Enclosed sets follow their own rules.** Circled letters have broad Latin and numeral coverage. Parenthesized letters focus on lowercase characters, while squared symbols are often capital-only. Converting lowercase input to an enclosed capital may create a consistent look, but it is a design choice rather than a literal lowercase mapping.

**Accents and non-English letters need special care.** A precomposed character such as é does not automatically inherit the style of e. Some systems can combine a styled base letter with an accent mark, but visual alignment varies. Names and multilingual text should be checked character by character instead of assuming complete Latin-script coverage.

**Punctuation usually passes through unchanged.** Mathematical alphabets do not provide matching commas, apostrophes, or most symbols. Ordinary punctuation is often the most readable choice. Decorative frames and dividers are separate characters added around or between the converted letters.

Before choosing a style, list the required character types: uppercase, lowercase, digits, accents, punctuation, and symbols. Test the hardest characters first. A slightly simpler style with complete coverage will look more intentional than an ornate alphabet that falls back in the middle of a name.`,
    howToUse: 'Test numbers, accented letters, punctuation, and the least common letters in your phrase before committing to a visual style.',
    examples: [
      { before: 'Math 2026', after: '𝐌𝐚𝐭𝐡 𝟐𝟎𝟐𝟔', note: 'Bold letters and digits have matching mathematical sets' },
      { before: 'subscript', after: 'ₛᵤbₛcᵣᵢₚₜ', note: 'Unsupported subscript letters remain ordinary or use approximations' },
      { before: 'CAFÉ', after: '𝙲𝙰𝙵É', note: 'Accented capitals may not have a matching styled codepoint' },
    ],
    faq: [
      { q: 'Why are fraktur numbers normal?', a: 'Unicode defines fraktur letters but does not define a separate complete fraktur numeral set.' },
      { q: 'Why is subscript missing so many letters?', a: 'Subscript characters were added for specific linguistic and scientific uses, not as a complete decorative alphabet.' },
      { q: 'Do accents work with fancy letters?', a: 'Sometimes a combining accent can be added, but alignment varies by font and many precomposed accented letters have no styled counterpart.' },
    ],
    relatedSlugs: ['how-unicode-text-works-guide', 'unicode-font-compatibility-guide', 'fancy-text-troubleshooting-guide'],
    icon: '🔣',
  },
];
