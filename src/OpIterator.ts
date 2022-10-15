import Op from './Op';

export default class Iterator {
  ops: Op[];

  // 当前 Op 的 index
  index: number;

  // 当前 Op 已经被消费的长度
  offset: number;

  constructor(ops: Op[]) {
    this.ops = ops;
    this.index = 0;
    this.offset = 0;
  }

  hasNext(): boolean {
    // 如果还有 Op，长度一定小于无穷大
    return this.peekLength() < Infinity;
  }

  // 注意这里并不是一个 Op 接一个 Op 的返回
  // OpIterator 在消费 Op 的时候，需要传入一个长度（这里通常要和另一个 Op transform，长度由两者中的较小者决定，这个长度通过 peekLength 获取）
  next(length?: number): Op {
    if (!length) {
      length = Infinity;
    }
    const nextOp = this.ops[this.index];
    if (nextOp) {
      // 当前还有 Op 没消费完
      const offset = this.offset;
      const opLength = Op.length(nextOp);
      // 如果要求消费的长度大于了当前剩余 Op 的长度，那么就仅仅消费完当前 Op
      if (length >= opLength - offset) {
        length = opLength - offset;
        // 调整下一次消费的起始位置
        this.index += 1;
        this.offset = 0;
      } else {
        this.offset += length;
      }
      if (typeof nextOp.delete === 'number') {
        // 是 delete Op
        return { delete: length };
      } else {
        // 其他的 Op 需要带属性
        const retOp: Op = {};
        if (nextOp.attributes) {
          retOp.attributes = nextOp.attributes;
        }
        if (typeof nextOp.retain === 'number') {
          // 是 retain Op
          retOp.retain = length;
        } else if (
          typeof nextOp.retain === 'object' &&
          nextOp.retain !== null
        ) {
          // 是 retain op，而且 retain 是一个对象
          // offset should === 0, length should === 1
          retOp.retain = nextOp.retain;
        } else if (typeof nextOp.insert === 'string') {
          // 是 insert op
          retOp.insert = nextOp.insert.substr(offset, length);
        } else {
          // 是 insert op，而且 insert 是一个对象，例如 embed
          // offset should === 0, length should === 1
          retOp.insert = nextOp.insert;
        }
        return retOp;
      }
    } else {
      // 默认返回一个 retain 剩余内容的操作，这在 Delta 的文档里也是有的
      return { retain: Infinity };
    }
  }

  // 拿到当前 Op
  peek(): Op {
    return this.ops[this.index];
  }

  // 拿到当前 Op 剩余的长度
  peekLength(): number {
    if (this.ops[this.index]) {
      // Should never return 0 if our index is being managed correctly
      // 通过 Op 原来的长度减去偏移值，得到 Op 剩余的长度
      // 逻辑上是不会出现 0 长度的，0 长度的话 index 就往后 +1 了
      return Op.length(this.ops[this.index]) - this.offset;
    } else {
      // 如果所有 index 都被消费，那么就返回 Infinity，即默认的 retain 到文档末尾
      return Infinity;
    }
  }

  // 拿到当前 Op 剩余的类型
  // 这个方法比较简单
  peekType(): string {
    const op = this.ops[this.index];
    if (op) {
      if (typeof op.delete === 'number') {
        return 'delete';
      } else if (
        typeof op.retain === 'number' ||
        (typeof op.retain === 'object' && op.retain !== null)
      ) {
        return 'retain';
      } else {
        return 'insert';
      }
    }
    // 默认到文档末尾的 retain
    return 'retain';
  }

  // 获取剩余的 Op
  rest(): Op[] {
    if (!this.hasNext()) {
      return [];
    } else if (this.offset === 0) {
      // 如果刚好消费完上一个 Op，直接返回后面的 Op
      return this.ops.slice(this.index);
    } else {
      // 如果没消费完，那么带上没消费完的
      // 由于 this.next 会改变 this.index 和 this.offset，所以这里要先保留现场，在操作后还原
      const offset = this.offset;
      const index = this.index;
      const next = this.next();
      const rest = this.ops.slice(this.index);
      this.offset = offset;
      this.index = index;
      return [next].concat(rest);
    }
  }
}
