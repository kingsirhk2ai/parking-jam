export interface UIElements {
  root: HTMLDivElement;
  levelLabel: HTMLDivElement;
  movesLabel: HTMLDivElement;
  starsBar: HTMLDivElement;
  modal: HTMLDivElement;
  resetButton: HTMLButtonElement;
  selectButton: HTMLButtonElement;
  tutorialLabel: HTMLDivElement;
}

export function buildUI(): UIElements {
  const root = document.createElement('div');
  root.id = 'ui-root';
  Object.assign(root.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', color: '#fff',
    fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
  } as Partial<CSSStyleDeclaration>);

  const topBar = document.createElement('div');
  Object.assign(topBar.style, {
    position: 'absolute',
    top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
    left: '16px', right: '16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
  } as Partial<CSSStyleDeclaration>);

  const levelLabel = pill('Level 1');
  const starsBar = pill('☆☆☆');
  starsBar.style.letterSpacing = '4px';
  starsBar.style.fontSize = '20px';
  const movesLabel = pill('Moves: 0');
  topBar.append(levelLabel, starsBar, movesLabel);
  root.appendChild(topBar);

  const bottomBar = document.createElement('div');
  Object.assign(bottomBar.style, {
    position: 'absolute',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
    left: '16px', right: '16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
  } as Partial<CSSStyleDeclaration>);
  const resetButton = makeButton('↻ Reset');
  const selectButton = makeButton('Levels');
  bottomBar.append(resetButton, selectButton);
  root.appendChild(bottomBar);

  const tutorialLabel = document.createElement('div');
  Object.assign(tutorialLabel.style, {
    position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 80px)',
    left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,.55)', padding: '10px 16px', borderRadius: '12px',
    fontSize: '14px', maxWidth: 'min(82vw, 440px)', textAlign: 'center',
    display: 'none', backdropFilter: 'blur(6px)',
  } as Partial<CSSStyleDeclaration>);
  root.appendChild(tutorialLabel);

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    position: 'absolute', inset: '0', display: 'none',
    justifyContent: 'center', alignItems: 'center',
    background: 'rgba(0,0,0,.55)', pointerEvents: 'auto', padding: '20px',
  } as Partial<CSSStyleDeclaration>);
  root.appendChild(modal);

  document.body.appendChild(root);
  return { root, levelLabel, movesLabel, starsBar, modal, resetButton, selectButton, tutorialLabel };
}

function pill(text: string): HTMLDivElement {
  const d = document.createElement('div');
  d.textContent = text;
  Object.assign(d.style, {
    fontSize: '16px', fontWeight: '700',
    padding: '8px 14px', borderRadius: '14px',
    background: 'rgba(0,0,0,.4)',
    backdropFilter: 'blur(8px)',
    textShadow: '0 1px 2px rgba(0,0,0,.5)',
  } as Partial<CSSStyleDeclaration>);
  return d;
}

function makeButton(label: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  Object.assign(btn.style, {
    pointerEvents: 'auto',
    background: 'rgba(255,255,255,.14)',
    color: '#fff', border: '1px solid rgba(255,255,255,.22)',
    padding: '12px 18px', borderRadius: '14px',
    fontSize: '15px', fontWeight: '600',
    backdropFilter: 'blur(8px)',
    cursor: 'pointer', minWidth: '90px',
  } as Partial<CSSStyleDeclaration>);
  return btn;
}

export function setStarsBar(el: HTMLDivElement, stars: number): void {
  let s = '';
  for (let i = 0; i < 3; i++) s += i < stars ? '★' : '☆';
  el.textContent = s;
  el.style.color = stars >= 3 ? '#ffd66e' : stars >= 1 ? '#ffe9a8' : '#cccccc';
}

export function showWinModal(
  modal: HTMLDivElement,
  levelId: number,
  moves: number,
  par: number,
  stars: number,
  isLast: boolean,
  onNext: () => void,
  onRetry: () => void,
): void {
  modal.innerHTML = '';
  const card = document.createElement('div');
  Object.assign(card.style, {
    background: 'linear-gradient(140deg, #2d3344 0%, #1a1d28 100%)',
    color: '#fff', padding: '28px 30px', borderRadius: '22px',
    minWidth: 'min(86vw, 360px)', textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06) inset',
  } as Partial<CSSStyleDeclaration>);

  const h = document.createElement('div');
  h.textContent = `Level ${levelId} Clear!`;
  Object.assign(h.style, { fontSize: '24px', fontWeight: '700', marginBottom: '14px' } as Partial<CSSStyleDeclaration>);
  card.appendChild(h);

  const starsRow = document.createElement('div');
  let s = '';
  for (let i = 0; i < 3; i++) s += i < stars ? '★' : '☆';
  starsRow.textContent = s;
  Object.assign(starsRow.style, {
    fontSize: '56px', letterSpacing: '12px',
    color: stars >= 3 ? '#ffd66e' : stars >= 2 ? '#ffe9a8' : '#cccccc',
    marginBottom: '6px',
  } as Partial<CSSStyleDeclaration>);
  card.appendChild(starsRow);

  const sub = document.createElement('div');
  sub.textContent = `Moves: ${moves}  •  Par: ${par}`;
  Object.assign(sub.style, { fontSize: '14px', opacity: '.8', marginBottom: '22px' } as Partial<CSSStyleDeclaration>);
  card.appendChild(sub);

  const row = document.createElement('div');
  Object.assign(row.style, { display: 'flex', gap: '10px', justifyContent: 'center' } as Partial<CSSStyleDeclaration>);
  const retry = makeButton('Retry');
  retry.onclick = onRetry;
  const next = makeButton(isLast ? 'Replay 1' : 'Next →');
  next.onclick = onNext;
  Object.assign(next.style, {
    background: 'linear-gradient(135deg, #4cd964, #2da050)',
    border: '1px solid rgba(255,255,255,.3)',
  } as Partial<CSSStyleDeclaration>);
  row.append(retry, next);
  card.appendChild(row);

  modal.appendChild(card);
  modal.style.display = 'flex';
}

export function hideModal(modal: HTMLDivElement): void {
  modal.style.display = 'none';
}

export function showLevelSelect(
  modal: HTMLDivElement,
  totalLevels: number,
  stars: Record<number, number>,
  currentId: number,
  onPick: (id: number) => void,
  onClose: () => void,
): void {
  modal.innerHTML = '';
  const card = document.createElement('div');
  Object.assign(card.style, {
    background: 'linear-gradient(140deg, #2d3344 0%, #1a1d28 100%)',
    color: '#fff', padding: '22px', borderRadius: '22px',
    minWidth: 'min(86vw, 360px)',
    boxShadow: '0 24px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06) inset',
  } as Partial<CSSStyleDeclaration>);

  const h = document.createElement('div');
  h.textContent = 'Select Level';
  Object.assign(h.style, { fontSize: '20px', fontWeight: '700', marginBottom: '14px', textAlign: 'center' } as Partial<CSSStyleDeclaration>);
  card.appendChild(h);

  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
  } as Partial<CSSStyleDeclaration>);
  for (let i = 1; i <= totalLevels; i++) {
    const cell = document.createElement('button');
    const s = stars[i] ?? 0;
    cell.innerHTML = `<div style="font-size:17px;font-weight:700">${i}</div>` +
      `<div style="font-size:13px;color:${s >= 1 ? '#ffd66e' : '#666'};letter-spacing:1px">` +
      (s > 0 ? '★'.repeat(s) : '· · ·') + '</div>';
    Object.assign(cell.style, {
      pointerEvents: 'auto',
      background: i === currentId ? 'rgba(76,217,100,.22)' : 'rgba(255,255,255,.08)',
      color: '#fff', border: '1px solid rgba(255,255,255,.22)',
      padding: '10px 0', borderRadius: '12px', cursor: 'pointer',
    } as Partial<CSSStyleDeclaration>);
    cell.onclick = () => onPick(i);
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  const close = makeButton('Close');
  Object.assign(close.style, { marginTop: '16px', width: '100%' } as Partial<CSSStyleDeclaration>);
  close.onclick = onClose;
  card.appendChild(close);

  modal.appendChild(card);
  modal.style.display = 'flex';
}
