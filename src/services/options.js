import { appState } from './app-state';
import _ from 'lodash';

export class Options {
  constructor() {}

  checkSomeOptionInIncludeAdded(include, parent) {
    let added = false;

    for (const el of include.layouts) {
      if (this.checkOptionAdded(el, parent, true)) {
        added = true;
        break;
      }
    }
    return added;
  }

  checkOptionAdded(obj, parent, isLayout) {
    // const isLayout = parent && parent.toLowerCase() === 'layout';

    if (_.isString(obj) && !isLayout) {
      obj = {
        [parent.toLowerCase()]: obj,
      };
    } else if (_.isString(obj) && isLayout) {
      obj = {
        layout: obj,
      };
    } else {
      obj = {
        [parent.toLowerCase()]: obj.name,
      };
    }

    const isInComplectation = _.some([appState.complectation.value], obj);
    return isInComplectation;
  }

  /**
   * Method to change options
   * @param {Options} obj - Object to replace option with
   */

  setOption(obj) {
    const currentValue = appState.complectation.value;
    const selected = Object.assign(currentValue, obj);
    selected.changedValue = Object.keys(obj)[0];
    appState.complectation.next(selected);
  }
}
