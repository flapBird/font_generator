const graphemeSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

const isRegionalIndicator = (character: string) => /\p{Regional_Indicator}/u.test(character);
const isGraphemeExtension = (character: string) => (
  /\p{Mark}/u.test(character)
  || /[\uFE00-\uFE0F]/u.test(character)
  || /[\u{E0100}-\u{E01EF}]/u.test(character)
  || /[\u{1F3FB}-\u{1F3FF}]/u.test(character)
  || /[\u{E0020}-\u{E007F}]/u.test(character)
  || character === '\u20E3'
);

const fallbackSegmentGraphemes = (text: string) => {
  const clusters: string[] = [];

  Array.from(text).forEach((character) => {
    const current = clusters.at(-1);
    if (!current) {
      clusters.push(character);
      return;
    }

    const regionalPair = isRegionalIndicator(character)
      && isRegionalIndicator(current)
      && Array.from(current).length === 1;
    if (
      isGraphemeExtension(character)
      || character === '\u200D'
      || current.endsWith('\u200D')
      || regionalPair
    ) {
      clusters[clusters.length - 1] = `${current}${character}`;
      return;
    }

    clusters.push(character);
  });

  return clusters;
};

/**
 * Split user-visible characters without separating emoji sequences, flags,
 * variation selectors, skin-tone modifiers, or combining marks.
 */
export const segmentGraphemes = (text: string): string[] => {
  if (!graphemeSegmenter) return fallbackSegmentGraphemes(text);
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
};

export const mapGraphemes = (
  text: string,
  transform: (grapheme: string, index: number) => string,
) => segmentGraphemes(text).map(transform).join('');

export const reverseGraphemes = (text: string) =>
  segmentGraphemes(text).reverse().join('');

export const reverseGraphemeLines = (text: string) =>
  text.split('\n').map(reverseGraphemes).join('\n');

export const joinGraphemes = (text: string, separator: string) =>
  segmentGraphemes(text).join(separator);
