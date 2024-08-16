// always returns an array
export function applyFilter(filter, item) {
  const result = filter(item)
  if (result === true) {return [item]}
  if (typeof result === "object") {return [result]}
  if (Array.isArray(result)) {return result.map(r => r === true ? item : r)}
  return []
}

// pipe multiple filters after another
export function filterPipeline(filters) {
  return quad => {
    var set = [quad]
    for (let f of filters) {
      const res = []
      for (let item of set) {
        res.push(...applyFilter(f, item))
      }
      set = res
    }
    return set
  }
}

/*
export function negateFilter(filter) {
  return item => filter(item) ? [] : true
}
*/
