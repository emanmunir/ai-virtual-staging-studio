import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHealth, getModes, stagePhoto } from './lib/api';
import {
  FALLBACK_MODES,
  FALLBACK_STYLES,
  STYLE_AWARE_MODES,
} from './lib/constants';
import {
  ApiError,
  type ModeId,
  type Provider,
  type StageResponse,
  type StyleId,
} from './types';
import { Dropzone } from './components/Dropzone';
import { EmptyState } from './components/EmptyState';
import { ErrorBanner } from './components/ErrorBanner';
import { Header } from './components/Header';
import { InstructionField } from './components/InstructionField';
import { ModeSelector } from './components/ModeSelector';
import { ResultPanel } from './components/ResultPanel';
import { ResultSkeleton } from './components/ResultSkeleton';
import { StylePicker } from './components/StylePicker';
import { Toggle } from './components/Toggle';
import { SparklesIcon } from './components/icons';

/** Rotating status messages shown while a staging request is in flight. */
const LOADING_MESSAGES: readonly string[] = [
  'Analyzing the room…',
  'Composing the design…',
  'Placing furniture and finishes…',
  'Rendering your staged photo…',
];

export default function App() {
  // Backend metadata.
  const [provider, setProvider] = useState<Provider | null>(null);
  const [modes, setModes] = useState(FALLBACK_MODES);
  const [styles, setStyles] = useState(FALLBACK_STYLES);

  // Form state.
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeId>('furnish');
  const [style, setStyle] = useState<StyleId>('modern');
  const [instruction, setInstruction] = useState('');
  const [enhance, setEnhance] = useState(true);

  // Request lifecycle.
  const [isStaging, setIsStaging] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [result, setResult] = useState<StageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styleRelevant = useMemo(() => STYLE_AWARE_MODES.has(mode), [mode]);

  // Load provider + modes/styles once on mount.
  useEffect(() => {
    const controller = new AbortController();

    getHealth(controller.signal)
      .then((health) => setProvider(health.provider))
      .catch(() => {
        /* Non-fatal: header simply shows the connecting state. */
      });

    getModes(controller.signal)
      .then((data) => {
        if (data.modes.length > 0) {
          setModes(data.modes);
        }
        if (data.styles.length > 0) {
          setStyles(data.styles);
        }
      })
      .catch(() => {
        /* Non-fatal: fall back to the static lists already in state. */
      });

    return () => controller.abort();
  }, []);

  // Manage the object URL lifecycle for the upload preview.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Cycle status messages while staging.
  useEffect(() => {
    if (!isStaging) {
      setLoadingIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [isStaging]);

  const handleSelectFile = useCallback((selected: File) => {
    setFile(selected);
    setError(null);
    setResult(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setFile(null);
    setResult(null);
  }, []);

  const handleStage = useCallback(async () => {
    if (!file || isStaging) {
      return;
    }
    setIsStaging(true);
    setError(null);
    setResult(null);
    try {
      const response = await stagePhoto({
        image: file,
        mode,
        style: styleRelevant ? style : undefined,
        instruction,
        enhance,
      });
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(
          `Could not reach the staging service. ${err.message}. Is the backend running?`,
        );
      } else {
        setError('An unexpected error occurred while staging the photo.');
      }
    } finally {
      setIsStaging(false);
    }
  }, [enhance, file, instruction, isStaging, mode, style, styleRelevant]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header provider={provider} />

      {/* Hero */}
      <section className="container-page pt-10 sm:pt-14">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs font-600 uppercase tracking-[0.16em] text-terracotta-600">
            <SparklesIcon width={14} height={14} />
            AI-powered
          </span>
          <h1 className="mt-4 font-display text-4xl font-600 leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Stage any listing photo in seconds.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Furnish empty rooms, clear the clutter, repaint walls, or turn a
            daytime exterior into a golden-hour dusk shot — all from a single
            photo.
          </p>
        </div>
      </section>

      {/* Workspace */}
      <main className="container-page grid flex-1 gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:py-12">
        {/* Left column — inputs */}
        <div className="space-y-5">
          <Dropzone
            file={file}
            previewUrl={previewUrl}
            onSelect={handleSelectFile}
            onError={setError}
            onClear={handleClearFile}
            disabled={isStaging}
          />

          <div className="surface space-y-5 p-5">
            <ModeSelector
              modes={modes}
              value={mode}
              onChange={setMode}
              disabled={isStaging}
            />

            {styleRelevant ? (
              <StylePicker
                styles={styles}
                value={style}
                onChange={setStyle}
                disabled={isStaging}
              />
            ) : (
              <p className="rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5 text-xs text-ink-muted">
                Design style isn’t used for this mode.
              </p>
            )}

            <InstructionField
              value={instruction}
              onChange={setInstruction}
              disabled={isStaging}
            />

            <div className="border-t border-line pt-4">
              <Toggle
                checked={enhance}
                onChange={setEnhance}
                disabled={isStaging}
                label="Enhance prompt"
                description="Let the AI expand your request into a richer staging brief."
              />
            </div>

            <button
              type="button"
              onClick={handleStage}
              disabled={!file || isStaging}
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-500 px-5 py-3.5 text-base font-600 text-canvas shadow-card transition hover:bg-terracotta-600 disabled:cursor-not-allowed disabled:bg-ink-muted/50 disabled:shadow-none"
            >
              {isStaging ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" />
                  Staging…
                </>
              ) : (
                <>
                  <SparklesIcon width={18} height={18} />
                  Stage Photo
                </>
              )}
            </button>
            {!file && (
              <p className="text-center text-xs text-ink-muted">
                Upload a photo to get started.
              </p>
            )}
          </div>
        </div>

        {/* Right column — output */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {isStaging ? (
            <div className="surface p-5">
              <ResultSkeleton
                status={LOADING_MESSAGES[loadingIndex] ?? 'Staging your photo…'}
              />
            </div>
          ) : result ? (
            <div className="surface p-5">
              <ResultPanel result={result} />
            </div>
          ) : (
            <div className="h-full min-h-[28rem]">
              <EmptyState />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line/70 bg-paper/60">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-muted sm:flex-row">
          <p>AI Virtual Staging Studio — portfolio demo.</p>
          <p>
            Staging results are AI-generated and for visualization purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
