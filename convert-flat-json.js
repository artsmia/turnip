let fs = require('fs')

let stopsFile = process.argv[2].replace('~', '/Users/kjell/')
let stops = JSON.parse(fs.readFileSync(stopsFile, 'utf-8'))

let restructureStops = (flatStops) => {
  let stops = flatStops.reduce((all, stop) => {
    var index = parseInt(stop.stop)
    var group = all[index] || []
    group.push(stop)
    all[index] = group
    return all
  }, [])
  return stops
}

// match the old audio tour YAML format
//     - id: 2
//       file: '002'
//       name: Music in the Tuileries Gardens, 1862, Édouard Manet
//       music: ''
//       speaker: Eric Bruce
//       colors:
let nestSecondaryStops = (stops) => {
  return stops.map(([main, ...colors]) => {
    let {stop, ...other} = main
    appendArtistToName(other)
    return {
      id: parseInt(main.stop),
      file: main.stop,
      ...other,
      colors: makeColors(colors)
    }
  })
}

let appendArtistToName = (stop) => stop.name =
  stop.artist ? stop.description + ', ' + stop.artist : stop.description

let makeColors = (stops) => {
  stops.map(stop => appendArtistToName(stop))
  let [green, red, yellow] = stops

  return ({
    green,
    red,
    yellow
  })
}


console.log(
  JSON.stringify(
    nestSecondaryStops(restructureStops(stops, null, 2))
  )
)
