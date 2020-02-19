import equal from 'deep-equal';
import extend from 'extend';

interface AttributeMap {
  [key: string]: any;
}

namespace AttributeMap {
  export function compose(
    a: AttributeMap = {},
    b: AttributeMap = {},
    keepNull: boolean,
  ): AttributeMap | undefined {
    if (typeof a !== 'object') {
      a = {};
    }
    if (typeof b !== 'object') {
      b = {};
    }
    let attributes = extend(true, {}, b);
    for (const key in a) {
      if (isObject(a[key]) && isObject(attributes[key])) {
        attributes[key] = compose(
          a[key],
          attributes[key],
          keepNull,
        );
      }
    }
    if (!keepNull) {
      attributes = Object.keys(attributes).reduce<AttributeMap>((copy, key) => {
        if (attributes[key] != null) {
          copy[key] = attributes[key];
        }
        return copy;
      }, {});
    }
    for (const key in a) {
      if (a[key] !== undefined && b[key] === undefined) {
        attributes[key] = a[key];
      }
    }
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }

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
    const attributes = Object.keys(a)
      .concat(Object.keys(b))
      .reduce<AttributeMap>((attrs, key) => {
        if (!equal(a[key], b[key])) {
          if (b[key] === undefined) {
            attrs[key] = null;
          } else if (isObject(a[key]) && isObject(b[key])) {
            attrs[key] = diff(a[key], b[key]);
          } else {
            attrs[key] = b[key];
          }
        }
        return attrs;
      }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }

  export function invert(attr: AttributeMap = {}, base: AttributeMap = {}) {
    attr = attr || {};
    const baseInverted = Object.keys(base).reduce<AttributeMap>((memo, key) => {
      if (!equal(base[key], attr[key]) && attr[key] !== undefined) {
        if (isObject(attr[key]) && isObject(base[key])) {
          memo[key] = invert(attr[key], base[key]);
        } else {
          memo[key] = base[key];
        }
      }
      return memo;
    }, {});
    return Object.keys(attr).reduce<AttributeMap>((memo, key) => {
      if (attr[key] !== base[key] && base[key] === undefined) {
        memo[key] = null;
      }
      return memo;
    }, baseInverted);
  }

  export function transform(
    a: AttributeMap | undefined,
    b: AttributeMap | undefined,
    priority: boolean = false,
  ): AttributeMap | undefined {
    if (typeof a !== 'object') {
      return b;
    }
    if (typeof b !== 'object') {
      return undefined;
    }
    if (!priority) {
      return b; // b simply overwrites us without priority
    }
    const attributes = Object.keys(b).reduce<AttributeMap>((attrs, key) => {
      if (a[key] === undefined) {
        attrs[key] = b[key]; // null is a valid value
      } else if (isObject(a[key]) && isObject(b[key])) {
        attrs[key] = transform(a[key], b[key], true);
      }
      return attrs;
    }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }
}

function isObject(value: any): boolean {
  return value === Object(value) && !Array.isArray(value);
}

export default AttributeMap;
