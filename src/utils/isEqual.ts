export const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
  
    if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }
  
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
  
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i])) return false;
      }
  
      return true;
    }
  
    if (Array.isArray(b)) return false;
  
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
  
    if (aKeys.length !== bKeys.length) return false;
  
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!isEqual(a[key], b[key])) return false;
    }
  
    return true;
  }
  