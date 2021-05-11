import diff from 'fast-diff';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import clamp from 'lodash.clamp';
import AttributeMap, { AttributeBlacklistMap } from './AttributeMap';
import Op from './Op';

const NULL_CHARACTER = String.fromCharCode(0); // Placeholder char for embed in diff()

// TODO: allow to be modified
const REMOVE_SPLIT_ATTRIBUTES: string[] = ['detectionId'];

function redoToRemoveSplitAttributesForOther(
  delta: Delta,
  splitKey: string,
  splitValue: any,
): Delta {
  const operationsToRedo = [];
  let lastOp = delta.pop();
  while (lastOp && lastOp.attributes?.[splitKey] === splitValue) {
    operationsToRedo.unshift(lastOp);
    lastOp = delta.pop();
  }
  if (lastOp) operationsToRedo.unshift(lastOp);

  operationsToRedo.forEach((op) => {
    const newAttributes = op.attributes;
    if (newAttributes && newAttributes[splitKey] === splitValue) {
      delete newAttributes[splitKey];
    }
    if (op.insert) {
      delta.insert(op.insert, newAttributes);
    } else if (op.delete) {
      delta.delete(op.delete);
    } else if (op.retain) {
      delta.retain(op.retain, newAttributes);
    }
  });
  return delta;
}

function redoToRemoveSplitAttributesForThis(
  delta: Delta,
  splitKey: string,
  lengthToGoBack: number,
): Delta {
  const operationsToRedo = [];
  let backCursor = 0;
  while (backCursor < lengthToGoBack) {
    const lastOp = delta.pop();
    if (!lastOp) break;
    operationsToRedo.unshift(lastOp);
    if (lastOp.delete) {
      backCursor -= Op.length(lastOp);
    } else {
      backCursor += Op.length(lastOp);
    }
  }

  // Account for if we went too far back
  const offset = Math.max(0, backCursor - lengthToGoBack);
  let forwardCursor = 0;

  operationsToRedo.forEach((op) => {
    // We don't need to modify insert or deletes
    // as they aren't from current list of operations
    if (op.insert || op.delete) {
      delta.push(op);
    } else if (op.retain) {
      const length = Op.length(op);
      const lengthToIgnore = clamp(forwardCursor - offset, 0, length);
      const lengthToChange = length - lengthToIgnore;

      if (lengthToIgnore > 0) {
        delta.retain(lengthToIgnore, op.attributes);
      }
      if (lengthToChange > 0) {
        // We need to purposefully "null" this attribute;
        const newAttributes = op.attributes || {};
        newAttributes[splitKey] = null;
        delta.retain(lengthToChange, newAttributes);
      }
      forwardCursor += length;
    }
  });
  return delta;
}

class Delta {
  static Op = Op;
  static AttributeMap = AttributeMap;

  ops: Op[];
  constructor(ops?: Op[] | { ops: Op[] }) {
    // Assume we are given a well formed ops
    if (Array.isArray(ops)) {
      this.ops = ops;
    } else if (ops != null && Array.isArray(ops.ops)) {
      this.ops = ops.ops;
    } else {
      this.ops = [];
    }
  }

  insert(arg: string | object, attributes?: AttributeMap): this {
    const newOp: Op = {};
    if (typeof arg === 'string' && arg.length === 0) {
      return this;
    }
    newOp.insert = arg;
    if (
      attributes != null &&
      typeof attributes === 'object' &&
      Object.keys(attributes).length > 0
    ) {
      newOp.attributes = attributes;
    }
    return this.push(newOp);
  }

  delete(length: number): this {
    if (length <= 0) {
      return this;
    }
    return this.push({ delete: length });
  }

  retain(length: number, attributes?: AttributeMap): this {
    if (length <= 0) {
      return this;
    }
    const newOp: Op = { retain: length };
    if (
      attributes != null &&
      typeof attributes === 'object' &&
      Object.keys(attributes).length > 0
    ) {
      newOp.attributes = attributes;
    }
    return this.push(newOp);
  }

  push(newOp: Op): this {
    let index = this.ops.length;
    let lastOp = this.ops[index - 1];
    newOp = cloneDeep(newOp);
    if (typeof lastOp === 'object') {
      if (
        typeof newOp.delete === 'number' &&
        typeof lastOp.delete === 'number'
      ) {
        this.ops[index - 1] = { delete: lastOp.delete + newOp.delete };
        return this;
      }
      // Since it does not matter if we insert before or after deleting at the same index,
      // always prefer to insert first
      if (typeof lastOp.delete === 'number' && newOp.insert != null) {
        index -= 1;
        lastOp = this.ops[index - 1];
        if (typeof lastOp !== 'object') {
          this.ops.unshift(newOp);
          return this;
        }
      }
      if (isEqual(newOp.attributes, lastOp.attributes)) {
        if (
          typeof newOp.insert === 'string' &&
          typeof lastOp.insert === 'string'
        ) {
          this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
          if (typeof newOp.attributes === 'object') {
            this.ops[index - 1].attributes = newOp.attributes;
          }
          return this;
        } else if (
          typeof newOp.retain === 'number' &&
          typeof lastOp.retain === 'number'
        ) {
          this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
          if (typeof newOp.attributes === 'object') {
            this.ops[index - 1].attributes = newOp.attributes;
          }
          return this;
        }
      }
    }
    if (index === this.ops.length) {
      this.ops.push(newOp);
    } else {
      this.ops.splice(index, 0, newOp);
    }
    return this;
  }

  pop(): Op | undefined {
    const op = this.ops.pop();
    return op;
  }

  chop(): this {
    const lastOp = this.ops[this.ops.length - 1];
    if (lastOp && lastOp.retain && !lastOp.attributes) {
      this.ops.pop();
    }
    return this;
  }

  filter(predicate: (op: Op, index: number) => boolean): Op[] {
    return this.ops.filter(predicate);
  }

  forEach(predicate: (op: Op, index: number) => void): void {
    this.ops.forEach(predicate);
  }

  map<T>(predicate: (op: Op, index: number) => T): T[] {
    return this.ops.map(predicate);
  }

  partition(predicate: (op: Op) => boolean): [Op[], Op[]] {
    const passed: Op[] = [];
    const failed: Op[] = [];
    this.forEach((op) => {
      const target = predicate(op) ? passed : failed;
      target.push(op);
    });
    return [passed, failed];
  }

  reduce<T>(
    predicate: (accum: T, curr: Op, index: number) => T,
    initialValue: T,
  ): T {
    return this.ops.reduce(predicate, initialValue);
  }

  changeLength(): number {
    return this.reduce((length, elem) => {
      if (elem.insert) {
        return length + Op.length(elem);
      } else if (elem.delete) {
        return length - elem.delete;
      }
      return length;
    }, 0);
  }

  length(): number {
    return this.reduce((length, elem) => {
      return length + Op.length(elem);
    }, 0);
  }

  slice(start = 0, end = Infinity): Delta {
    const ops = [];
    const iter = Op.iterator(this.ops);
    let index = 0;
    while (index < end && iter.hasNext()) {
      let nextOp;
      if (index < start) {
        nextOp = iter.next(start - index);
      } else {
        nextOp = iter.next(end - index);
        ops.push(nextOp);
      }
      index += Op.length(nextOp);
    }
    return new Delta(ops);
  }

  compose(other: Delta): Delta {
    const thisIter = Op.iterator(this.ops);
    const otherIter = Op.iterator(other.ops);
    const ops = [];
    const firstOther = otherIter.peek();
    if (
      firstOther != null &&
      typeof firstOther.retain === 'number' &&
      firstOther.attributes == null
    ) {
      let firstLeft = firstOther.retain;
      while (
        thisIter.peekType() === 'insert' &&
        thisIter.peekLength() <= firstLeft
      ) {
        firstLeft -= thisIter.peekLength();
        ops.push(thisIter.next());
      }
      if (firstOther.retain - firstLeft > 0) {
        otherIter.next(firstOther.retain - firstLeft);
      }
    }
    const delta = new Delta(ops);
    while (thisIter.hasNext() || otherIter.hasNext()) {
      if (otherIter.peekType() === 'insert') {
        delta.push(otherIter.next());
      } else if (thisIter.peekType() === 'delete') {
        delta.push(thisIter.next());
      } else {
        const length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        const thisOp = thisIter.next(length);
        const otherOp = otherIter.next(length);
        if (typeof otherOp.retain === 'number') {
          const newOp: Op = {};
          if (typeof thisOp.retain === 'number') {
            newOp.retain = length;
          } else {
            newOp.insert = thisOp.insert;
          }
          // Preserve null when composing with a retain, otherwise remove it for inserts
          const attributes = AttributeMap.compose(
            thisOp.attributes,
            otherOp.attributes,
            typeof thisOp.retain === 'number',
          );
          if (attributes) {
            newOp.attributes = attributes;
          }
          delta.push(newOp);

          // Optimization if rest of other is just retain
          if (
            !otherIter.hasNext() &&
            isEqual(delta.ops[delta.ops.length - 1], newOp)
          ) {
            const rest = new Delta(thisIter.rest());
            return delta.concat(rest).chop();
          }

          // Other op should be delete, we could be an insert or retain
          // Insert + delete cancels out
        } else if (
          typeof otherOp.delete === 'number' &&
          typeof thisOp.retain === 'number'
        ) {
          delta.push(otherOp);
        }
      }
    }
    return delta.chop();
  }

  concat(other: Delta): Delta {
    const delta = new Delta(this.ops.slice());
    if (other.ops.length > 0) {
      delta.push(other.ops[0]);
      delta.ops = delta.ops.concat(other.ops.slice(1));
    }
    return delta;
  }

  diff(other: Delta, cursor?: number | diff.CursorInfo): Delta {
    if (this.ops === other.ops) {
      return new Delta();
    }
    const strings = [this, other].map((delta) => {
      return delta
        .map((op) => {
          if (op.insert != null) {
            return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
          }
          const prep = delta === other ? 'on' : 'with';
          throw new Error('diff() called ' + prep + ' non-document');
        })
        .join('');
    });
    const retDelta = new Delta();
    const diffResult = diff(strings[0], strings[1], cursor);
    const thisIter = Op.iterator(this.ops);
    const otherIter = Op.iterator(other.ops);
    diffResult.forEach((component: diff.Diff) => {
      let length = component[1].length;
      while (length > 0) {
        let opLength = 0;
        switch (component[0]) {
          case diff.INSERT:
            opLength = Math.min(otherIter.peekLength(), length);
            retDelta.push(otherIter.next(opLength));
            break;
          case diff.DELETE:
            opLength = Math.min(length, thisIter.peekLength());
            thisIter.next(opLength);
            retDelta.delete(opLength);
            break;
          case diff.EQUAL:
            opLength = Math.min(
              thisIter.peekLength(),
              otherIter.peekLength(),
              length,
            );
            const thisOp = thisIter.next(opLength);
            const otherOp = otherIter.next(opLength);
            if (isEqual(thisOp.insert, otherOp.insert)) {
              retDelta.retain(
                opLength,
                AttributeMap.diff(thisOp.attributes, otherOp.attributes),
              );
            } else {
              retDelta.push(otherOp).delete(opLength);
            }
            break;
        }
        length -= opLength;
      }
    });
    return retDelta.chop();
  }

  eachLine(
    predicate: (
      line: Delta,
      attributes: AttributeMap,
      index: number,
    ) => boolean | void,
    newline = '\n',
  ): void {
    const iter = Op.iterator(this.ops);
    let line = new Delta();
    let i = 0;
    while (iter.hasNext()) {
      if (iter.peekType() !== 'insert') {
        return;
      }
      const thisOp = iter.peek();
      const start = Op.length(thisOp) - iter.peekLength();
      const index =
        typeof thisOp.insert === 'string'
          ? thisOp.insert.indexOf(newline, start) - start
          : -1;
      if (index < 0) {
        line.push(iter.next());
      } else if (index > 0) {
        line.push(iter.next(index));
      } else {
        if (predicate(line, iter.next(1).attributes || {}, i) === false) {
          return;
        }
        i += 1;
        line = new Delta();
      }
    }
    if (line.length() > 0) {
      predicate(line, {}, i);
    }
  }

  invert(base: Delta): Delta {
    const inverted = new Delta();
    this.reduce((baseIndex, op) => {
      if (op.insert) {
        inverted.delete(Op.length(op));
      } else if (op.retain && op.attributes == null) {
        inverted.retain(op.retain);
        return baseIndex + op.retain;
      } else if (op.delete || (op.retain && op.attributes)) {
        const length = (op.delete || op.retain) as number;
        const slice = base.slice(baseIndex, baseIndex + length);
        slice.forEach((baseOp) => {
          if (op.delete) {
            inverted.push(baseOp);
          } else if (op.retain && op.attributes) {
            inverted.retain(
              Op.length(baseOp),
              AttributeMap.invert(op.attributes, baseOp.attributes),
            );
          }
        });
        return baseIndex + length;
      }
      return baseIndex;
    }, 0);
    return inverted.chop();
  }

  transform(index: number, priority?: boolean): number;
  transform(other: Delta, priority?: boolean): Delta;
  transform(arg: number | Delta, priority = false): typeof arg {
    priority = !!priority;
    if (typeof arg === 'number') {
      return this.transformPosition(arg, priority);
    }
    const other: Delta = arg;
    const thisIter = Op.iterator(this.ops);
    const otherIter = Op.iterator(other.ops);
    const delta = new Delta();

    const splitValues = REMOVE_SPLIT_ATTRIBUTES.reduce<AttributeBlacklistMap>(
      (map, attrKey) => {
        map[attrKey] = [];
        return map;
      },
      {},
    );

    let runningCursor = 0;
    const thisAttributeMarker: Array<[number, number, string]> = [];
    const otherAttributeMarker: Array<[number, number, string]> = [];

    while (thisIter.hasNext() || otherIter.hasNext()) {
      if (
        thisIter.peekType() === 'insert' &&
        (priority || otherIter.peekType() !== 'insert')
      ) {
        // Check if this insert has split any attributes
        const otherAttr = otherIter.peekAttributes();
        if (otherAttr) {
          REMOVE_SPLIT_ATTRIBUTES.forEach((key) => {
            const hasBeenSplit = otherAttr[key];
            if (hasBeenSplit) {
              splitValues[key].push(hasBeenSplit);
              redoToRemoveSplitAttributesForOther(delta, key, hasBeenSplit);
            }
          });
        }

        const thisAttr = thisIter.peekAttributes();
        const length = Op.length(thisIter.next());
        if (thisAttr?.detectionId) {
          thisAttributeMarker.push([
            runningCursor,
            runningCursor + length,
            thisAttr.detectionId,
          ]);
        }

        delta.retain(length);
        runningCursor += length;
      } else if (otherIter.peekType() === 'insert') {
        // Check if this insert has split any attributes
        const thisAttr = thisIter.peekAttributes();
        if (thisAttr) {
          REMOVE_SPLIT_ATTRIBUTES.forEach((key) => {
            const hasBeenSplit = thisAttr[key];
            if (hasBeenSplit) {
              splitValues[key].push(hasBeenSplit);

              // TODO: handle those detections that span over one operation...
              redoToRemoveSplitAttributesForThis(
                delta,
                key,
                thisIter.currentOffset(),
              );
            }
          });
        }

        const otherAttr = otherIter.peekAttributes();
        const op = otherIter.next();
        const length = Op.length(op);
        if (otherAttr?.detectionId) {
          otherAttributeMarker.push([
            runningCursor,
            runningCursor + length,
            otherAttr.detectionId,
          ]);
        }

        delta.push(op);
        runningCursor += length;
      } else {
        const length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        const thisOp = thisIter.next(length);
        const otherOp = otherIter.next(length);

        // TODO: generalise this
        if (thisOp.attributes?.detectionId) {
          thisAttributeMarker.push([
            runningCursor,
            thisOp.delete ? runningCursor - length : runningCursor + length,
            thisOp.attributes.detectionId,
          ]);
        }
        if (otherOp.attributes?.detectionId) {
          otherAttributeMarker.push([
            runningCursor,
            otherOp.delete ? runningCursor - length : runningCursor + length,
            otherOp.attributes.detectionId,
          ]);
        }

        if (thisOp.delete) {
          // TODO: generalise this
          // Check if a detection has been split
          const low = runningCursor - thisOp.delete;
          const high = runningCursor;
          const toChange = otherAttributeMarker.filter(
            ([start, end]) => !(high < start || low >= end),
          );
          toChange.forEach(([, , detId]) => {
            splitValues['detectionId'].push(detId);
            redoToRemoveSplitAttributesForOther(delta, 'detectionId', detId);
          });

          // Our delete either makes their delete redundant or removes their retain
          runningCursor -= length;
          continue;
        } else if (otherOp.delete) {
          // TODO: generalise this
          const low = runningCursor - otherOp.delete;
          const high = runningCursor;
          const toChange = thisAttributeMarker
            .filter(([start, end]) => !(high < start || low >= end))
            .map(([start, _, detId]) => {
              splitValues['detectionId'].push(detId);
              return start;
            });
          if (toChange.length > 0) {
            const min = Math.min(...toChange);
            redoToRemoveSplitAttributesForThis(
              delta,
              'detectionId',
              runningCursor - min,
            );
          }

          delta.push(otherOp);
          runningCursor -= length;
        } else {
          // We retain either their retain or insert
          delta.retain(
            length,
            AttributeMap.transform(
              thisOp.attributes,
              otherOp.attributes,
              priority,
              splitValues,
            ),
          );
          runningCursor += length;
        }
      }
    }
    return delta.chop();
  }

  transformPosition(index: number, priority = false): number {
    priority = !!priority;
    const thisIter = Op.iterator(this.ops);
    let offset = 0;
    while (thisIter.hasNext() && offset <= index) {
      const length = thisIter.peekLength();
      const nextType = thisIter.peekType();
      thisIter.next();
      if (nextType === 'delete') {
        index -= Math.min(length, index - offset);
        continue;
      } else if (nextType === 'insert' && (offset < index || !priority)) {
        index += length;
      }
      offset += length;
    }
    return index;
  }
}

export = Delta;
