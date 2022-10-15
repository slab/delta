import * as diff from 'fast-diff';
import cloneDeep = require('lodash.clonedeep');
import isEqual = require('lodash.isequal');
import AttributeMap from './AttributeMap';
import Op from './Op';
import OpIterator from './OpIterator';

const NULL_CHARACTER = String.fromCharCode(0); // Placeholder char for embed in diff()

interface EmbedHandler<T> {
  compose(a: T, b: T, keepNull: boolean): T;
  invert(a: T, b: T): T;
  transform(a: T, b: T, priority: boolean): T;
}

// 返回 embed 的 type 和前后 retain 的值
const getEmbedTypeAndData_ = (
  a: Op['insert'] | Op['retain'],
  b: Op['retain'], // 原来的方法这里给的类型有误导性，其实是要 Op['retain'] 里面的 Record
): [string, unknown, unknown] => {
  if (typeof a !== 'object' || a === null) {
    // a 必须是 insert embed 或者 retain embed
    // 如果 insert 的时候不是 embed，那么就不会有 retain embed
    throw new Error(`cannot retain a ${typeof a}`);
  }
  if (typeof b !== 'object' || b === null) {
    // other 必须是 retain object
    throw new Error(`cannot retain a ${typeof b}`);
  }
  // embed 对象的第一个 key 必须是一致的
  const embedType = Object.keys(a)[0];
  if (!embedType || embedType !== Object.keys(b)[0]) {
    throw new Error(
      `embed types not matched: ${embedType} != ${Object.keys(b)[0]}`,
    );
  }
  return [embedType, a[embedType], b[embedType]];
};

const getEmbedTypeAndData = (
  a: Op['insert'] | Op['retain'],
  b: Op['insert'],
): [string, unknown, unknown] => {
  if (typeof a !== 'object' || a === null) {
    // a 必须是 insert 或者 retain embed
    throw new Error(`cannot retain a ${typeof a}`);
  }
  if (typeof b !== 'object' || b === null) {
    // other 必须是 retain object
    throw new Error(`cannot retain a ${typeof b}`);
  }
  const embedType = Object.keys(a)[0];
  if (!embedType || embedType !== Object.keys(b)[0]) {
    throw new Error(
      `embed types not matched: ${embedType} != ${Object.keys(b)[0]}`,
    );
  }
  return [embedType, a[embedType], b[embedType]];
};

// 概念上是对 Ops 的封装
class Delta {
  static Op = Op;
  static OpIterator = OpIterator;
  static AttributeMap = AttributeMap;
  private static handlers: { [embedType: string]: EmbedHandler<unknown> } = {};

  static registerEmbed<T>(embedType: string, handler: EmbedHandler<T>): void {
    this.handlers[embedType] = handler;
  }

  static unregisterEmbed(embedType: string): void {
    delete this.handlers[embedType];
  }

  private static getHandler(embedType: string): EmbedHandler<unknown> {
    const handler = this.handlers[embedType];
    if (!handler) {
      throw new Error(`no handlers for embed type "${embedType}"`);
    }
    return handler;
  }

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

  insert(
    arg: string | Record<string, unknown>,
    attributes?: AttributeMap | null,
  ): this {
    const newOp: Op = {};
    if (typeof arg === 'string' && arg.length === 0) {
      // 插入空字符，不做任何事
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

  retain(
    // Ref https://github.com/quilljs/delta/pull/77
    // > This PR adds support for retaining embeds, making it possible for nested data structure transforming.
    length: number | Record<string, unknown>,
    attributes?: AttributeMap | null,
  ): this {
    if (typeof length === 'number' && length <= 0) {
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

  // 以上这三个方法比较简单，就一些参数验证加 push
  // 另外也没有合并同类 Op 的操作
  // 当然保持了数据结构的正确性和紧凑性

  // 这个方法比较有趣！
  push(newOp: Op): this {
    let index = this.ops.length;
    let lastOp = this.ops[index - 1];
    newOp = cloneDeep(newOp);
    if (typeof lastOp === 'object') {
      // 合并两个 delete 操作
      if (
        typeof newOp.delete === 'number' &&
        typeof lastOp.delete === 'number'
      ) {
        this.ops[index - 1] = { delete: lastOp.delete + newOp.delete };
        return this;
      }
      // Since it does not matter if we insert before or after deleting at the same index,
      // always prefer to insert first
      // 对于 delete 和 insert 来说先后顺序没有差别，这里统一处理成先 inert 后 delete，以保持一致性
      // 这里跟 ot.js 的处理是一样的
      if (typeof lastOp.delete === 'number' && newOp.insert != null) {
        index -= 1; // 将 index 和 lastOp 都变为倒数第二个
        lastOp = this.ops[index - 1];
        if (typeof lastOp !== 'object') {
          // 如果超出了数组起始位置，那么直接把 newOp 插入到数组开头
          this.ops.unshift(newOp);
          return this;
        }
      }
      // 只有属性相同才能合并操作
      if (isEqual(newOp.attributes, lastOp.attributes)) {
        if (
          typeof newOp.insert === 'string' &&
          typeof lastOp.insert === 'string'
        ) {
          // 合并 insert
          this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
          // 处理属性
          if (typeof newOp.attributes === 'object') {
            this.ops[index - 1].attributes = newOp.attributes;
          }
          return this;
        } else if (
          typeof newOp.retain === 'number' &&
          typeof lastOp.retain === 'number'
        ) {
          // 合并 retain
          this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
          // 处理属性
          if (typeof newOp.attributes === 'object') {
            this.ops[index - 1].attributes = newOp.attributes;
          }
          return this;
        }
      }
    }
    // 在最后一个位置插入
    if (index === this.ops.length) {
      this.ops.push(newOp);
    } else {
      // 在中间插入，看上面的分支逻辑，仅有在 138 行有一个调整
      this.ops.splice(index, 0, newOp);
    }
    return this;
  }

  chop(): this {
    // 一个规整 Delta 的方法，如果最后一个 Op 是不往字符串增加属性的 retain，那么删除它
    // 因为默认最后一个 Op 是隐式的 retain Infinity
    const lastOp = this.ops[this.ops.length - 1];
    if (lastOp && typeof lastOp.retain === 'number' && !lastOp.attributes) {
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
    // 按某种条件将 Op 分成两组
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

  // 这个方法可以获取 Delta 对文本串的变更长度，加上 insert 的长度并减去 delete 的长度
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
    // delete 也是贡献正值
    return this.reduce((length, elem) => {
      return length + Op.length(elem);
    }, 0);
  }

  // 按照范围从 Delta 中取出 Op
  slice(start = 0, end = Infinity): Delta {
    const ops = [];
    const iter = new OpIterator(this.ops);
    let index = 0;
    while (index < end && iter.hasNext()) {
      let nextOp;
      if (index < start) {
        // TODO: 这里用可能导致 length 大于当前 Op 的长度，但是用例里没有覆盖？
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
    const thisIter = new OpIterator(this.ops);
    const otherIter = new OpIterator(other.ops);
    const ops = [];

    // 构建第一个 Op
    // 这里的逻辑就是匹配 thisIter 的 insert 和 otherIter 的不带属性变更的 retain:number 操作
    // 不知道为什么要单独写在这里，而不是放到 while 循环里
    // 可能是因为真实的场景下，otherOp 通常都是在文档很后面的一处的编辑，因此第一个 Op 是个很长的 plain retain
    // 这里可以提升性能

    // 所以这里是为了让 getEmbedTypeAndData_ 那里第一个判断条件不会抛出错误？ NO

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
        // other:insert
        // 第二个 Delta 的 insert 必然不会受到第一个 Delta 的影响，直接插入
        // 这里跟 ot.js 有所不同的是，ot.js 会先判断下面的 delete
        delta.push(otherIter.next());
      } else if (thisIter.peekType() === 'delete') {
        // this:delete
        // 第一个 Delta 的 delete 必然不会受到第二个 Delta 的影响，直接插入
        delta.push(thisIter.next());
      } else {
        // this:insert this:retain
        // other:retain other:delete
        // 从这里往下还有四种 case 需要处理（由于 Delta 支持 retain embed，实际上会有所不同）
        // 获取两个长度的最小值
        const length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        // 获取 this op
        const thisOp = thisIter.next(length);
        // 获取 other op
        const otherOp = otherIter.next(length);

        if (otherOp.retain) {
          // this:insert this:retain
          // other:retain
          const newOp: Op = {};
          if (typeof thisOp.retain === 'number') {
            // this:retain:number
            // 两个 op 均为 retain，那么取 min 的 retain
            // 如果 otherOp retain embed，保留 otherOp 的 retain
            newOp.retain =
              typeof otherOp.retain === 'number' ? length : otherOp.retain;
          } else {
            // this:retain:embed this:insert
            // other:retain
            if (typeof otherOp.retain === 'number') {
              // other:retain:number
              if (thisOp.retain == null) {
                newOp.insert = thisOp.insert;
              } else {
                // thisOp retain
                newOp.retain = thisOp.retain;
              }
            } else {
              // this:retain:embed this:insert
              // other:retain:embed
              const action = thisOp.retain == null ? 'insert' : 'retain';
              const [embedType, thisData, otherData] = getEmbedTypeAndData_(
                thisOp[action],
                otherOp.retain,
              );
              const handler = Delta.getHandler(embedType); // 对于不同类型的 embed 有不同的处理方式
              newOp[action] = {
                [embedType]: handler.compose(
                  thisData,
                  otherData,
                  action === 'retain',
                ),
              };
            }
          }

          // Preserve null when composing with a retain, otherwise remove it for inserts
          // 对于 other retain 需要组合属性
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
          // 如果 otherOp 剩余的部分都是 retain，那么直接将 thisOp 剩余的部分 push 进去
          // 这个也是个 hot path 了
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
          (typeof thisOp.retain === 'number' ||
            (typeof thisOp.retain === 'object' && thisOp.retain !== null))
        ) {
          delta.push(otherOp);
        }

        // 如果是 insert 然后 delete，那么不塞入任何 op，相等于两个操作抵消了
      }
    }
    return delta.chop();
  }

  // TODO: 不知道有啥用，demo 只演示了 insert 的 concat
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

    // diff 的两个 Delta 只能对两组 insert 操作进行 diff，不能有其他任何操作
    // 将两个 Delta map 成两个 string
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
    const diffResult = diff(strings[0], strings[1], cursor); // 找出两个 string 的 diff
    const thisIter = new OpIterator(this.ops);
    const otherIter = new OpIterator(other.ops);
    // 遍历每个 diff
    diffResult.forEach((component: diff.Diff) => {
      let length = component[1].length;
      while (length > 0) {
        let opLength = 0;
        switch (component[0]) {
          case diff.INSERT:
            // 如果是 other 新增了，插入这个 op 对应长度的东西
            opLength = Math.min(otherIter.peekLength(), length);
            retDelta.push(otherIter.next(opLength));
            break;
          case diff.DELETE:
            // 如果 other 中被移除掉了
            // 从 this 中移除
            opLength = Math.min(length, thisIter.peekLength());
            thisIter.next(opLength);
            retDelta.delete(opLength);
            break;
          case diff.EQUAL:
            // 如果是一致的
            // 求最小值
            opLength = Math.min(
              thisIter.peekLength(),
              otherIter.peekLength(),
              length,
            );
            const thisOp = thisIter.next(opLength);
            const otherOp = otherIter.next(opLength);
            // 完全一致，包括 insert embed 也一致，那么就 diff 属性
            if (isEqual(thisOp.insert, otherOp.insert)) {
              retDelta.retain(
                opLength,
                AttributeMap.diff(thisOp.attributes, otherOp.attributes),
              );
            } else {
              // 都是 insert 但 embed 不一致，那么就直接从 this 中删除换成 other 的
              retDelta.push(otherOp).delete(opLength);
            }
            break;
        }
        length -= opLength;
      }
    });
    return retDelta.chop();
  }

  // 遍历每一行
  // 应该是只对表示文档内容的 Delta 才有意义
  eachLine(
    predicate: (
      line: Delta, // 把每行的内容放到 Delta 当中
      attributes: AttributeMap,
      index: number,
    ) => boolean | void,
    newline = '\n', // 行分隔符
  ): void {
    const iter = new OpIterator(this.ops);
    let line = new Delta();
    let i = 0;
    while (iter.hasNext()) {
      if (iter.peekType() !== 'insert') {
        // 如果有非 insert 的操作，那么直接返回
        return;
      }
      // 可以看作下面所有的 Op 都是 insert
      const thisOp = iter.peek();
      const start = Op.length(thisOp) - iter.peekLength(); // 处理当前这个 Op 累计的偏移值
      const index =
        typeof thisOp.insert === 'string'
          ? thisOp.insert.indexOf(newline, start) - start // 找出换行点相对于 start 的偏移量
          : -1; // embed 是不可能存在换行点的
      if (index < 0) {
        // 当前 Op 中没有换行点，直接整个塞入当前行内容
        line.push(iter.next());
      } else if (index > 0) {
        // 如果有换行点，那么就把换行点前面的塞入
        line.push(iter.next(index));
      } else {
        // 到了换行点
        // 调用回调
        if (predicate(line, iter.next(1).attributes || {}, i) === false) {
          return;
        }
        i += 1;
        // 准备下一个行
        line = new Delta();
      }
    }
    // 循环完毕最后一行不为空，再调用一次回调
    if (line.length() > 0) {
      predicate(line, {}, i);
    }
  }

  // 实际就是获取相对于原文档 base 的 Delta 的 undo
  invert(base: Delta): Delta {
    const inverted = new Delta();
    // 注意这里 baseIndex 的含义
    // 是 this 应用之前 Delta 的 index
    this.reduce((baseIndex, op) => {
      if (op.insert) {
        // insert 的 undo
        inverted.delete(Op.length(op));
      } else if (typeof op.retain === 'number' && op.attributes == null) {
        // 如果是 plain retain，那么 undo 也是 retain
        // 注意这里要加上 retain 的长度
        inverted.retain(op.retain);
        return baseIndex + op.retain;
      } else if (op.delete || typeof op.retain === 'number') {
        // 如果是 delete 或者有属性的 retain
        // 要从原 Delta 中取出相应的操作
        const length = (op.delete || op.retain) as number;
        const slice = base.slice(baseIndex, baseIndex + length);
        slice.forEach((baseOp) => {
          if (op.delete) {
            inverted.push(baseOp); // 删了什么都要放回去
          } else if (op.retain && op.attributes) {
            // 是有属性的 retain，把属性 undo
            inverted.retain(
              Op.length(baseOp),
              AttributeMap.invert(op.attributes, baseOp.attributes),
            );
          }
        });
        return baseIndex + length;
      } else if (typeof op.retain === 'object' && op.retain !== null) {
        // retain embed
        const slice = base.slice(baseIndex, baseIndex + 1);
        const baseOp = new OpIterator(slice.ops).next(); // 把对应的 embed 取出来
        const [embedType, opData, baseOpData] = getEmbedTypeAndData(
          op.retain,
          baseOp.insert,
        );
        const handler = Delta.getHandler(embedType);
        inverted.retain(
          { [embedType]: handler.invert(opData, baseOpData) },
          AttributeMap.invert(op.attributes, baseOp.attributes),
        );
        return baseIndex + 1;
      }
      return baseIndex;
    }, 0);
    return inverted.chop();
  }

  // 注意！这里是单边的 transform
  transform(index: number, priority?: boolean): number;
  transform(other: Delta, priority?: boolean): Delta;
  transform(arg: number | Delta, priority = false): typeof arg {
    // 如果参数是一个 index，其实就是代理调用 transformPosition
    priority = !!priority;
    if (typeof arg === 'number') {
      return this.transformPosition(arg, priority);
    }

    const other: Delta = arg;
    const thisIter = new OpIterator(this.ops);
    const otherIter = new OpIterator(other.ops);
    const delta = new Delta();

    // 没有可能出现 thisIter otherIter 一个为空一个不为空的情况？
    // 这里 otjs 是会抛出错误的，为何 Delta 不会？
    // 应当是由于 Delta 隐式的 retain infinity 吧
    while (thisIter.hasNext() || otherIter.hasNext()) {
      if (
        thisIter.peekType() === 'insert' &&
        (priority || otherIter.peekType() !== 'insert')
      ) {
        // 如果有 this 的 insert 优先或者 other 的操作不是 insert，那么就先处理 this 的 insert   
        delta.retain(Op.length(thisIter.next()));
      } else if (otherIter.peekType() === 'insert') {
        // 然后再处理 other 的 insert
        delta.push(otherIter.next());
      } else {
        // 到这里就剩下 4 大类情况了
        const length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        const thisOp = thisIter.next(length);
        const otherOp = otherIter.next(length);
        if (thisOp.delete) {
          // Our delete either makes their delete redundant or removes their retain
          // this 的 delete 会让 other 的 delete 或 retain 无效
          continue;
        } else if (otherOp.delete) {
          // other 的 delete op 使得 this 的 retain 无效
          delta.push(otherOp);
        } else {
          // 最后一种 case，两个 retain 有冲突
          const thisData = thisOp.retain;
          const otherData = otherOp.retain;
          let transformedData: Op['retain'] =
            // 如果 other 是 retain embed，那么就用 other 的 retain
            typeof otherData === 'object' && otherData !== null
              ? otherData
              : length;
          if (
            typeof thisData === 'object' &&
            thisData !== null &&
            typeof otherData === 'object' &&
            otherData !== null
          ) {
            // 如果两种都是 retain object，那么就需要外部来决策如何处理
            const embedType = Object.keys(thisData)[0];
            if (embedType === Object.keys(otherData)[0]) {
              const handler = Delta.getHandler(embedType);
              if (handler) {
                transformedData = {
                  [embedType]: handler.transform(
                    thisData[embedType],
                    otherData[embedType],
                    priority,
                  ),
                };
              }
            }
          }

          // We retain either their retain or insert
          delta.retain(
            transformedData,
            AttributeMap.transform(
              thisOp.attributes,
              otherOp.attributes,
              priority,
            ),
          );
        }
      }
    }
    return delta.chop();
  }

  transformPosition(index: number, priority = false): number {
    priority = !!priority;
    const thisIter = new OpIterator(this.ops);
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

export default Delta;

export { Op, OpIterator, AttributeMap };

if (typeof module === 'object') {
  module.exports = Delta;
  module.exports.default = Delta;
}
