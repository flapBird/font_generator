// Dedicated worker: image pixels never leave this browser. Termination cancels CPU work too.
import { createMatcher } from './font-identifier-engine/0.4.2/src/match.mjs';
let matcher;
self.onmessage = async ({ data }) => {
  try {
    if (!matcher) { self.postMessage({ type: 'status', message: 'Loading the local font model…' }); matcher = await createMatcher(); }
    self.postMessage({ type: 'status', message: 'Comparing letter shapes on your device…' });
    const matches = await matcher.match(data.image);
    self.postMessage({ type: 'results', matches: matches.slice(0, 10).map(({ face }) => ({ family: face.family, styleName: face.styleName || 'Regular', weight: face.weight || 400, style: face.style === 'italic' ? 'italic' : 'normal' })) });
  } catch { self.postMessage({ type: 'error', message: 'The local model could not complete this match. Try a clearer crop or retry loading the model.' }); }
};
