function hasNestedValue(obj, path, delimiter = "_") {
  const keys = path.split(delimiter);
  let current = obj;

  for (const key of keys) {
    while(Array.isArray(current) && current.length == 1 && current[0]){
      current = current[0]
    }
    while(current['value']){
      current = current.value
    }
    
    if (current && typeof current === "object") {
      if (Array.isArray(current)) {
        const index = current.findIndex(x => x == key)
        if (index != -1) {
          current = current[index];
        } else {
          return false;
        }
      } else if (key in current) {
        current = current[key];
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
}


module.exports = { hasNestedValue};