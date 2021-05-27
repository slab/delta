import AttributeMap from './AttributeMap';
import Iterator from './Iterator';

interface Op {
  // only one property out of {insert, delete, retain} will be present
  insert?: string | object;
  delete?: number;
  retain?: number | object;

  attributes?: AttributeMap;
}

namespace Op {
  export function iterator(ops: Op[]): Iterator {
    return new Iterator(ops);
  }

  export function length(op: Op): number {
    if (typeof op.delete === 'number') {
      return op.delete;
    } else if (typeof op.retain === 'number') {
      return op.retain;
    } else if (typeof op.retain === 'object' && op.retain !== null) {
      return 1;
    } else {
      return typeof op.insert === 'string' ? op.insert.length : 1;
    }
  }
}

export default Op;
