// always returns an array
export function filterQuad(filter, quad) {
  const result = filter(quad) || []
  if (result === true) {
    return [true]
  } else if (Array.isArray(result)) {
    return result
  } else {
    return [result]
  }
}

// pipe multiple filters after another
export function filterPipeline(filters) {
  return quad => {
    var set = [quad]
    for (let f of filters) {
      const res = []
      for (let item of set) {
        const quads = filterQuad(f, item).map(q => q === true ? item : q)
        res.push(...quads)
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
