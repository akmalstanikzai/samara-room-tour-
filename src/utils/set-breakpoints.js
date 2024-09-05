import { appState } from '../services/app-state';

export function setBreakpoints() {
  if (window.innerWidth < 768) {
    appState.layout.next('mobile');
  }
  if (window.innerWidth >= 768) {
    appState.layout.next('desktop');
  }
}
