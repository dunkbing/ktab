import { createRoot } from 'react-dom/client';
import App from '@src/app';
// @ts-expect-error That's because output file is create during build
import tailwindcssOutput from '../dist/tailwind-output.css?inline';

const root = document.createElement('div');
root.id = 'chrome-extension-boilerplate-react-vite-content-view-root';
document.body.append(root);

const rootIntoShadow = document.createElement('div');
rootIntoShadow.id = 'shadow-root';

const shadowRoot = root.attachShadow({ mode: 'open' });

if (navigator.userAgent.includes('Firefox')) {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = tailwindcssOutput;
  shadowRoot.appendChild(styleElement);
} else {
  const globalStyleSheet = new CSSStyleSheet();
  globalStyleSheet.replaceSync(tailwindcssOutput);
  shadowRoot.adoptedStyleSheets = [globalStyleSheet];
}

shadowRoot.appendChild(rootIntoShadow);

const reactRoot = createRoot(rootIntoShadow);
reactRoot.render(<App />);

rootIntoShadow.addEventListener('keydown', e => e.stopPropagation());
rootIntoShadow.addEventListener('mousedown', e => e.stopPropagation());
