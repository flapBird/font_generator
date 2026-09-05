export interface TextDraftSnapshot {
  text: string | null;
  revision: number;
}

/** An empty edit is local to tools already open, never a default for a new page. */
export function resolveGeneratorText(snapshot: TextDraftSnapshot, openedAtRevision: number, defaultText: string) {
  if (snapshot.text === null) return defaultText;
  if (!snapshot.text.trim() && snapshot.revision === openedAtRevision) return defaultText;
  return snapshot.text;
}

export function readSavedGeneratorText(value: string | null) {
  return value?.trim() ? value : null;
}
