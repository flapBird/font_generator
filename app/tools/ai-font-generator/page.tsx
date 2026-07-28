import UnavailableTool from '@/components/UnavailableTool';

export default function AIFontGeneratorPage() {
  return (
    <UnavailableTool
      eyebrow="Feature status"
      title="AI Font Generator"
      description="A real prompt-to-font model and downloadable font-file workflow are still under development."
      explanation="Generating an original typeface requires a trained model, character-set validation, spacing work, and a real export pipeline. The current site does not yet provide those capabilities."
    />
  );
}
