/** DOM lifecycle helpers; these tests do not qualify a WebGL renderer. */
export function leaseCameraInteraction(stage: HTMLElement, canvas: HTMLCanvasElement | null,
  onExit: () => void, host: Window): () => void {
  const priorStage = stage.style.touchAction;
  const priorCanvas = canvas?.style.touchAction;
  stage.style.touchAction = 'none';
  if (canvas) canvas.style.touchAction = 'none';
  let active = true;
  const release = () => {
    if (!active) return;
    active = false;
    host.removeEventListener('keydown', keydown);
    host.removeEventListener('blur', blur);
    stage.style.touchAction = priorStage;
    if (canvas && priorCanvas !== undefined) canvas.style.touchAction = priorCanvas;
  };
  const exit = () => { release(); onExit(); };
  const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') exit(); };
  const blur = () => exit();
  host.addEventListener('keydown', keydown);
  host.addEventListener('blur', blur);
  return release;
}
export function observeCanvasContext(canvas: HTMLCanvasElement, lost: () => void,
  restored: () => void): () => void {
  const onLost = (event: Event) => { event.preventDefault(); lost(); };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', restored);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', restored);
  };
}
