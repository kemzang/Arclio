function centerElement(navbar, title, direction) {
  let centerId = Math.random().toString(36).substring(3, 8)
  let c = document.createElement('div')
  c.id = centerId
  c.className = 'center'
  let t = document.createElement('span')
  if (!window.__disable_nav_title_transition__) {
    t.className = 'title title-transition'
  } else {
    t.className = 'title'
  }

  t.innerHTML = title
  let reverse = direction == 'back'
  t.style.opacity = 0
  if (!window.__disable_nav_title_transition__ && utils.is_ios_device()) {
    t.style.transform = 'translate3d(' + (reverse ? '-' : '') + getTitleTransitionDistance(t) + 'px,0,0)'
    t.style.webkitTransform = 'translate3d(' + (reverse ? '-' : '') + getTitleTransitionDistance(t) + 'px,0,0)'
  }
  if (!navbar.querySelector('.center')) {
    t.style.opacity = 1
    t.style.transform = 'translate3d(0,0,0)'
    t.style.webkitTransform = 'translate3d(0,0,0)'
  }
  c.appendChild(t)
  navbar.appendChild(c)
  return document.getElementById(centerId)
}
