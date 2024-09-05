import { appState } from '../services/app-state';

function getOrientation() {
  if (window.orientation && typeof window.orientation === 'number') {
    if (Math.abs(window.orientation) === 90) {
      return 'landscape';
    } else {
      return 'portrait';
    }
  } else {
    return false;
  }
}
appState.deviceOrientation.next(getOrientation());

window.addEventListener(
  'orientationchange',
  () => {
    appState.deviceOrientation.next(getOrientation());
  },
  false
);
