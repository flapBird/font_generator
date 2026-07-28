import UnavailableTool from '@/components/UnavailableTool';

export default function FontIdentifierPage() {
  return (
    <UnavailableTool
      eyebrow="Feature status"
      title="Font Identifier"
      description="Image-based font recognition is temporarily unavailable while the matching system is rebuilt."
      explanation="Reliable font identification needs image preprocessing and a real font-matching database. This page does not currently analyze uploads or claim a match."
    />
  );
}
