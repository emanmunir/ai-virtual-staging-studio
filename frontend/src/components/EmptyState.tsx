import { ImageIcon } from './icons';

/** Placeholder shown in the result column before the first staging run. */
export function EmptyState() {
  const steps = [
    { n: 1, title: 'Upload a photo', body: 'Drop in a room or exterior shot.' },
    { n: 2, title: 'Pick a mode & style', body: 'Furnish, declutter, repaint, or day-to-dusk.' },
    { n: 3, title: 'Stage & compare', body: 'Reveal the result with the before/after slider.' },
  ];

  return (
    <section className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-line bg-paper/60 p-8 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-canvas text-ink-muted">
        <ImageIcon width={30} height={30} />
      </span>
      <h2 className="mt-5 font-display text-xl font-600 text-ink">
        Your staged room appears here
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
        Upload a photo and choose how you want the space transformed. Results
        arrive as an interactive before/after comparison.
      </p>

      <ol className="mx-auto mt-7 grid w-full max-w-md gap-3 text-left">
        {steps.map((step) => (
          <li
            key={step.n}
            className="flex items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3"
          >
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-xs font-600 text-canvas">
              {step.n}
            </span>
            <div>
              <p className="text-sm font-600 text-ink">{step.title}</p>
              <p className="text-xs text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
