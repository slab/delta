import equal = require("deep-equal");
import extend = require("extend");

interface Attributes {
  [key: string]: any;
}

namespace Attributes {
  export function compose(
    a: Attributes = {},
    b: Attributes = {},
    keepNull: boolean
  ): Attributes | undefined {
    if (typeof a !== "object") {
      a = {};
    }
    if (typeof b !== "object") {
      b = {};
    }
    let attributes = extend(true, {}, b);
    if (!keepNull) {
      attributes = Object.keys(attributes).reduce<Attributes>((copy, key) => {
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
    a: Attributes = {},
    b: Attributes = {}
  ): Attributes | undefined {
    if (typeof a !== "object") {
      a = {};
    }
    if (typeof b !== "object") {
      b = {};
    }
    const attributes = Object.keys(a)
      .concat(Object.keys(b))
      .reduce<Attributes>((attrs, key) => {
        if (!equal(a[key], b[key])) {
          attrs[key] = b[key] === undefined ? null : b[key];
        }
        return attrs;
      }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }

  export function transform(
    a: Attributes = {},
    b: Attributes = {},
    priority: boolean = false
  ): Attributes | undefined {
    if (typeof a !== "object") {
      return b;
    }
    if (typeof b !== "object") {
      return undefined;
    }
    if (!priority) {
      return b; // b simply overwrites us without priority
    }
    const attributes = Object.keys(b).reduce<Attributes>((attrs, key) => {
      if (a[key] === undefined) {
        attrs[key] = b[key]; // null is a valid value
      }
      return attrs;
    }, {});
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }
}

export default Attributes;
