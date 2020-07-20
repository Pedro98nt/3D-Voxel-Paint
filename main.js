const TILE_SIZE = 30

const viewport = document.getElementById('viewport')
const scene = document.getElementById('scene')
const grid = document.getElementById('grid')

const model = new Array(4096).fill().map(item => ({ type: 'a' }))
const types = {
  a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', h: 'h',
  i: 'i', j: 'j', k: 'k', l: 'l', m: 'm', n: 'n', o: 'o', p: 'p'
}

function getIndex ([x, y, z]) { return x + y * 16 + z * 256 }

function getPosition (index) {
  const z = Math.floor(index / 256)
  const y = Math.floor((index / 16) % 16)
  const x = index % 16

  return [x, y, z]
}

function applyFaceOffset (face, [x, y, z]) {
  switch (face) {
    case 0: return [x, y, z + 1]
    case 1: return [x + 1, y, z]
    case 2: return [x - 1, y, z]
    case 3: return [x, y - 1, z]
    case 4: return [x, y + 1, z]
    case 5: return [x, y, z - 1]
    default: return null
  }
}

function optimizeFaces (position, hide) {
  const oppositeFaces = { 0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0 }
  const cube = model[getIndex(position)].element

  for (let face = 0; face < 6; face++) {
    const neighbor = model[getIndex(applyFaceOffset(face, position))]
    
    if (neighbor && neighbor.type !== 'a') {
      if (hide) cube.childNodes[face].className = 'hidden'
      neighbor.element.childNodes[oppositeFaces[face]].className = hide ? 'hidden' : ''
    }
  }
}

function renderCube (type, position) {
  const cube = document.createElement('div')

  cube.className = `cube ${type}`
  cube.onclick = event => {
    if (blockType === 'a') { 
      cube.remove()
      model[getIndex(position)] = { type: 'a', element: null }
      optimizeFaces(position, false)
    } else {
      const face = Array.from(cube.children).indexOf(event.target)
      const newPosition = applyFaceOffset(face, position)
 
      if (!newPosition.some(axis => (axis < 0 || axis > 15))) {
        const newCube = renderCube(blockType, newPosition)
 
        model[getIndex(newPosition)] = { type: blockType, element: newCube }
        optimizeFaces(newPosition, true)
      }
    }
  }

  for (let i = 0; i < 6; i++) cube.appendChild(document.createElement('div'))
  
  scene.appendChild(cube)
  cube.style.transform = `translate3D(\
    ${position[0] * TILE_SIZE}px,\
    ${position[1] * TILE_SIZE}px,\
    ${position[2] * TILE_SIZE + TILE_SIZE / 2}px)`

  return cube
}

window.onmousedown = event => {
  if (event.target !== document.getElementById('level')) dragging = true
}

window.onmouseup = event => (dragging = false)

window.onmousemove = event => {
  if (dragging) {
    rotation -= event.movementX * 0.5
    angle -= event.movementY * 0.5
    
    rotateScene(rotation, angle)
  }
}

function rotateScene (rotation, angle) {
  viewport.style.transform = `rotateX(${angle}deg) rotateZ(${rotation}deg)`
}

function fillGrid () {
  const grid = document.getElementById('grid')

  for (let i = 0; i < 256; i++) {
    const cell = document.createElement('div')
    
    cell.onclick = event => {
      if (blockType !== 'a') {
        const position = [i % 16, Math.floor(i / 16), parseInt(level)]
        const cube = renderCube(blockType, position)

        model[getIndex(position)] = { type: blockType, element: cube }
        optimizeFaces(position, true)
      }
    }
 
    grid.appendChild(cell)
  }
}

function fillColors () {
  const colors = document.getElementById('color')
  
  for (let type of Object.values(types)) {
    const color = document.createElement('li')
    
    color.className = type
    color.onclick = event => {
      colors.className = type
      blockType = type
    }
 
    colors.appendChild(color)
  }
}

function moveGrid (position) {
  const height = position * TILE_SIZE + 1
  
  scene.style.transform = `translateZ(-${height}px)`
  grid.style.transform = `translateZ(${height}px)`
  
  level = position
}

document.getElementById('level').oninput = event => {
  moveGrid(event.target.value)
  document.getElementById('level-label').textContent = event.target.value
}

document.getElementById('level-icon').onclick = event => {
  document.getElementById('grid').classList.toggle('hidden')
}

document.getElementById('clear').onclick = event => clearModel()

function exportModel (model) {
  let previous = ''
  let data = ''
  let counter = 0
  
  model.forEach(({ type }) => {
    if (type !== previous) {
      data += `${counter > 1 ? counter : ''}${previous}`
      previous = type
      counter = 1
    } else {
      counter++
    }
  })
  
  return data += `${counter > 1 ? counter : ''}${previous}`
}

function clearModel () {
  model.forEach((item => {
    item.type = 'a';
    item.element && item.element.remove()
    item.element = null
  }))
}

function importModel (data) {
  const sequence = data.split(/(\d+|[a-z])/).filter(Boolean)

  let counter = 1
  let total = 0

  sequence.forEach(token => {
    if (parseInt(token)) {
      counter = parseInt(token)
    } else {
      if (token !== 'a') {
        for (let i = 0; i < counter; i++) {
          const cube = renderCube(token, getPosition(total + i))
          
          model[total + i] = { type: token, element: cube }
        }
      }

      total += counter
      counter = 1
    }
  })
}

let rotation = 45
let angle = 70
let level = 0
let blockType = 'i'
let dragging = false

fillGrid()
fillColors()
moveGrid(7)

importModel('145ag2a4f9ag3a3f206a3f9a2g7f6a3g4a3f6a3gf3a3f7a2ga5f141a6f8a9f2g5a9f2g5af3a4f5a3g5a2f6a2g6a2f6a2g6af7a3gf3af12a3f110a5f10af5a2f2g5af8a2g5af8a2g4af6a3f2g4af6af7agf6af7agf5af10af3af7ap4a3f8ap101a5f10af5a2fag5af7af2g4af8af2g4af7al2ag4af6af8af5a2f9af3al8ap3ai2f7a3p13a3p115a2f2i2f3ag5af6af2ag4af6a2f2ag4af6af3ag4af6af8af5a2f9af3af7a2p5if7ap2a4i9a2p2i100a3i12ai2ai10a2f4af3ag4af7af2ag4af6ai8af6ai8af4a2i9ai3af8a3i3ai9ai2a4i10a2i100a5i10a2i2a2i9af4a2i8af5af9ai4ai10ai4ai10af2a2i10a2i2f11a4i11a4i101a2i12a2i2ai11a2i2ai9a2k3ai9ak4ak10ak4a2k9ak4a2k9ak3ak12a4k128a3i13ai2ai7a4k2gai6a2g6ai8ag7ag6a2g7ag6a2g7ag7ag5a3g6a2gk4a2g9a4k2g112a3i6ak6ai2ai5ak2g2k2a3i5ag5ak2g7ag6a3k6ag8a2k5ag8a2k5ag5a4k6ag5akg9ak2g2k11ak103a2i6ak6ai2ai5a2g2k4a3i5ag3ak10ag5ab9ag6a2k7ag6a2k7ag5ab10ag3ak11a2g2k12ak104ai14aiai6a2g5a3i5ag2a2k11ag4ab10ag5ak9ag5ak9ag4ab10ag2a2k12a2g133a3p7a3i3a3p6ai3ai2ap7ai5a2i8ai5a3i7ai5a3i7ai5a2i9ai3ai12a3i131a3p13apap7a3i3a2p7a5i11a4ip11a4ip11a5i12a3i148ap14a3p13a2p161a')