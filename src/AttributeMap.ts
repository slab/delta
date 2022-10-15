import cloneDeep = require('lodash.clonedeep');
import isEqual = require('lodash.isequal');

interface AttributeMap {
  [key: string]: unknown;
}

namespace AttributeMap {
  // 组合两个属性映射
  export function compose(
    a: AttributeMap = {},
    b: AttributeMap = {},
    keepNull = false,
  ): AttributeMap | undefined {
    if (typeof a !== 'object') {
      a = {};
    }
    if (typeof b !== 'object') {
      b = {};
    }
    let attributes = cloneDeep(b);

    // 如果不 keepNull，那么这里先把 b 中的 null 删除
    if (!keepNull) {
      attributes = Object.keys(attributes).reduce<AttributeMap>((copy, key) => {
        if (attributes[key] != null) {
          copy[key] = attributes[key];
        }
        return copy;
      }, {});
    }

    // 如果 a 中存在的属性在 b 中不存在，那么都取 a 中的值
    // 其他的属性都取 b 中的值
    for (const key in a) {
      if (a[key] !== undefined && b[key] === undefined) {
        attributes[key] = a[key];
      }
    }
    return Object.keys(attributes).length > 0 ? attributes : undefined; // 下面也经常见到的操作，如果是个空对象直接换成 undefined 返回
  }

  // 计算两个属性映射的差异
  export function diff(
    a: AttributeMap = {},
    b: AttributeMap = {},
  ): AttributeMap | undefined {
    if (typeof a !== 'object') {
      a = {};
    }
    if (typeof b !== 'object') {
      b = {};
    }
    // 将 a b 当中的所有属性合并成一个数组
    // 这里没有去重，实际上有重复计算
    const attributes = Object.keys(a)
      .concat(Object.keys(b))
      .reduce<AttributeMap>((attrs, key) => {
        // 如果 a b 中的属性不同
        if (!isEqual(a[key], b[key])) {
          // 如果这个属性在 b 中不存在，就设置为 null（以移除这个属性），否则用 b 的值
          attrs[key] = b[key] === undefined ? null : b[key];
        }
        return attrs;
      }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }
  // 注意这两个运算的效果是compose(a, diff(a, b)) === b

  // 计算把 b 撤销到 a 的属性映射
  export function invert(
    attr: AttributeMap = {},
    base: AttributeMap = {},
  ): AttributeMap {
    attr = attr || {};
    // 对于 base 中的属性，如果在 attr 中存在但不同，那么就取 base 中的值
    // 问：如果 base 中的属性在 attr 中不存在呢？不应该来一个 null 吗？看用例是根本不管这里了
    const baseInverted = Object.keys(base).reduce<AttributeMap>((memo, key) => {
      if (base[key] !== attr[key] && attr[key] !== undefined) {
        memo[key] = base[key];
      }
      return memo;
    }, {});
    // 对于在 attr 中的属性，如果在 base 中不存在，那么就设置为 null（以移除这个属性）
    return Object.keys(attr).reduce<AttributeMap>((memo, key) => {
      if (attr[key] !== base[key] && base[key] === undefined) {
        memo[key] = null;
      }
      return memo;
    }, baseInverted);
  }
  // Delta 只想把 b 对于 a 的影响撤销掉，而不是完全撤销到 a

  export function transform(
    a: AttributeMap | undefined,
    b: AttributeMap | undefined,
    priority = false,
  ): AttributeMap | undefined {
    if (typeof a !== 'object') {
      return b;
    }
    if (typeof b !== 'object') {
      return undefined;
    }
    // 如果不具有优先级，那么直接返回 b
    if (!priority) {
      return b; // b simply overwrites us without priority
    }
    const attributes = Object.keys(b).reduce<AttributeMap>((attrs, key) => {
      // 对于 b 中的属性，如果在 a 中不存在，那么就取 b 中的值
      // 因为 a 是优先的，所以如果 a 中存在，那么就不管了
      if (a[key] === undefined) {
        attrs[key] = b[key]; // null is a valid value
      }
      return attrs;
    }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }
}

export default AttributeMap;
