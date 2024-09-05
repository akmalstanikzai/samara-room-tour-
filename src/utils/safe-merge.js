import _ from 'lodash';

export function safeMerge(source, target) {
  _.merge(source, target);
}
