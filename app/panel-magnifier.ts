/** Freeze the current card's rendered styles before moving a copy to the top layer.
 * Ancestor-specific dashboard CSS would otherwise reflow the enlarged card.
 */
export function mountPanelMagnifier(source: HTMLElement, viewport: HTMLElement) {
  const doc = source.ownerDocument;
  const view = doc.defaultView;
  if (!view) return;
  const bounds = source.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const copy = source.cloneNode(true) as HTMLElement;
  const originals = [source, ...source.querySelectorAll<HTMLElement | SVGElement>('*')];
  const copies = [copy, ...copy.querySelectorAll<HTMLElement | SVGElement>('*')];
  const pseudoRules: string[] = [];
  originals.forEach((original, i) => {
    const target = copies[i];
    const computed = view.getComputedStyle(original);
    for (let j = 0; j < computed.length; j++) {
      const property = computed[j];
      target.style.setProperty(property, computed.getPropertyValue(property), 'important');
    }
    target.style.setProperty('animation', 'none', 'important');
    target.style.setProperty('transition', 'none', 'important');
    target.style.setProperty('caret-color', 'transparent', 'important');
    target.removeAttribute('id');
    target.removeAttribute('aria-labelledby');
    target.removeAttribute('aria-describedby');
    target.removeAttribute('autofocus');
    target.setAttribute('tabindex', '-1');
    const key = `${source.dataset.panelIndex}-${i}`;
    target.setAttribute('data-magnifier-node', key);
    for (const pseudo of ['::before', '::after']) {
      const style = view.getComputedStyle(original, pseudo);
      if (!style.content || style.content === 'none' || style.content === 'normal') continue;
      const declarations: string[] = [];
      for (let j = 0; j < style.length; j++) {
        const property = style[j];
        declarations.push(`${property}:${style.getPropertyValue(property)} !important;`);
      }
      pseudoRules.push(`[data-magnifier-node="${key}"]${pseudo}{${declarations.join('')}animation:none !important;transition:none !important;}`);
    }
  });
  viewport.setAttribute("role", "img");
  viewport.setAttribute("aria-label", source.innerText);
  copy.inert = true;
  copy.setAttribute('aria-hidden', 'true');
  copy.setAttribute('data-magnifier-copy', 'true');
  const reset = {
    position: 'relative', inset: 'auto', margin: '0',
    width: `${bounds.width}px`, height: `${bounds.height}px`,
    'min-width': '0', 'min-height': '0', 'max-width': 'none', 'max-height': 'none',
    'box-sizing': 'border-box', transform: 'none', flex: 'none', 'pointer-events': 'none',
  };
  Object.entries(reset).forEach(([key, value]) => copy.style.setProperty(key, value, 'important'));
  const surface = doc.createElement('div');
  surface.dataset.magnifierSurface = 'true';
  surface.append(copy);
  surface.style.transformOrigin = 'top left';
  surface.style.width = `${bounds.width}px`;
  surface.style.height = `${bounds.height}px`;
  const style = doc.createElement('style');
  style.textContent = pseudoRules.join('\n');
  viewport.replaceChildren(style, surface);
  const fit = () => {
    const anchor = source.getBoundingClientRect();
    const margin = 12;
    const scale = Math.min(1.3, (view.innerWidth - margin * 2) / bounds.width, (view.innerHeight - margin * 2) / bounds.height);
    viewport.style.width = `${bounds.width * scale}px`;
    viewport.style.height = `${bounds.height * scale}px`;
    viewport.dataset.magnifierScale = String(scale);
    surface.style.transform = `scale(${scale})`;
    const dialog = viewport.closest('dialog');
    if (dialog) {
      const wantedLeft = anchor.left < view.innerWidth / 2 ? anchor.left : anchor.right - bounds.width * scale;
      dialog.style.left = `${Math.max(margin, Math.min(wantedLeft, view.innerWidth - bounds.width * scale - margin))}px`;
      dialog.style.top = `${Math.max(margin, Math.min(anchor.top, view.innerHeight - bounds.height * scale - margin))}px`;
    }
  };
  fit();
  view.addEventListener('resize', fit);
  return () => {
    view.removeEventListener('resize', fit);
    viewport.replaceChildren();
  };
}
