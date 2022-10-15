import AttributeMap from './AttributeMap';

// 不喜欢这里的写法，分成多种 Op type 可能会更好
// ADT 思想
interface Op {
  // only one property out of {insert, delete, retain} will be present
  insert?: string | Record<string, unknown>;
  delete?: number;
  retain?: number | Record<string, unknown>; // 为什么 retain 也可以是一个对象？

  attributes?: AttributeMap;
}

namespace Op {
  export function length(op: Op): number {
    if (typeof op.delete === 'number') {
      return op.delete;
    } else if (typeof op.retain === 'number') {
      return op.retain;
    } else if (typeof op.retain === 'object' && op.retain !== null) {
      // Ref https://github.com/quilljs/delta/pull/77
      // > This PR adds support for retaining embeds, making it possible for nested data structure transforming.
      return 1;
    } else {
      return typeof op.insert === 'string' ? op.insert.length : 1;
    }
  }
}

export default Op;
