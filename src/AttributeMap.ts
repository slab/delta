import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';

interface AttributeMap {
  [key: string]: any;
}

export interface AttributeBlacklistMap {
  [key: string]: any[];
}

function validate<T>(
  key: string,
  value: T,
  blacklist: AttributeBlacklistMap | undefined,
  useNull: boolean,
): T | null | undefined {
  if (!key || !value || !blacklist) return value;
  const blacklistValues = blacklist[key] || [];
  if (blacklistValues.indexOf(value) !== -1) {
    if (useNull) return null;
    else return undefined;
  } else {
    return value;
  }
}

function validateAll(
  attributes: AttributeMap | undefined,
  blacklist: AttributeBlacklistMap | undefined,
  useNull: boolean,
): AttributeBlacklistMap | undefined {
  if (!attributes || !blacklist) return attributes;
  const attr = Object.keys(attributes).reduce<AttributeMap>((copy, key) => {
    copy[key] = validate(key, attributes[key], blacklist, useNull);
    if (typeof copy[key] === 'undefined') {
      delete copy[key];
    }
    return copy;
  }, {});
  return Object.keys(attr).length > 0 ? attr : undefined;
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
    let attributes = cloneDeep(b);
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
        if (!isEqual(a[key], b[key])) {
          attrs[key] = b[key] === undefined ? null : b[key];
        }
        return attrs;
      }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }

  export function invert(
    attr: AttributeMap = {},
    base: AttributeMap = {},
  ): AttributeMap {
    attr = attr || {};
    const baseInverted = Object.keys(base).reduce<AttributeMap>((memo, key) => {
      if (base[key] !== attr[key] && attr[key] !== undefined) {
        memo[key] = base[key];
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
    priority = false,
    blacklist: AttributeBlacklistMap | undefined = undefined,
  ): AttributeMap | undefined {
    if (typeof a !== 'object') {
      return validateAll(b, blacklist, false);
    }
    if (typeof b !== 'object') {
      return diff(a, validateAll(a, blacklist, true)); // only need the difference
    }
    if (!priority) {
      return validateAll(b, blacklist, false); // b simply overwrites us without priority
    }
    const attributes = Object.keys(b).reduce<AttributeMap>((attrs, key) => {
      if (a[key] === undefined) {
        attrs[key] = validate(key, b[key], blacklist, false);
        if (typeof attrs[key] === 'undefined') {
          delete attrs[key]; // should delete becuase its invalid
        }
      } else if (a[key] !== null) {
        if (validate(key, a[key], blacklist, true) === null) {
          // we need to delete because it's invalid...
          attrs[key] = null;
        }
      }
      return attrs;
    }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }
}

export default AttributeMap;
