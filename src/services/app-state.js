import { BehaviorSubject } from 'rxjs';
import { setBreakpoints } from '../utils/set-breakpoints';

export const appState = {
  /**
   * @typedef {object} Loading
   * @property {boolean} isLoading
   * @property {number} percent
   */
  loading: new BehaviorSubject({
    isLoading: true,
    percent: null,
  }),
  errors: new BehaviorSubject({
    isError: false,
    message: null,
  }),
  layout: new BehaviorSubject(null),
  resizeEvent: new BehaviorSubject(false),
  deviceOrientation: new BehaviorSubject(null),
  renderingStatus: new BehaviorSubject(false),
  modelLoadingIndicator: new BehaviorSubject({ isLoading: false, name: '' }),
  cam: new BehaviorSubject('bath'),
  complectation: new BehaviorSubject({ layout: 'studio' }),
};

setBreakpoints();

window.addEventListener('resize', () => {
  appState.resizeEvent.next(true);
  setBreakpoints();
});
