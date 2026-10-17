// Icons: Iconsax "Bulk" variant (iconsax-react 0.0.8, MIT, https://iconsax-react.pages.dev/). `C` is the color slot.
const ICONSAX = {
  tick: '<path opacity=".4" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="C"/><path d="M10.58 15.582a.75.75 0 0 1-.53-.22l-2.83-2.83a.754.754 0 0 1 0-1.06c.29-.29.77-.29 1.06 0l2.3 2.3 5.14-5.14c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06l-5.67 5.67a.75.75 0 0 1-.53.22Z" fill="C"/>',
  refresh: '<path fill="C" d="M14.55 22.42c-.33 0-.64-.22-.73-.56-.1-.4.13-.81.53-.92a9.256 9.256 0 006.89-8.95c0-5.1-4.15-9.25-9.25-9.25-4.33 0-7.17 2.53-8.5 4.06h2.94c.41 0 .75.34.75.75s-.32.76-.74.76H2.01c-.07 0-.14-.01-.21-.03a.899.899 0 01-.24-.12.659.659 0 01-.21-.23c-.05-.1-.09-.2-.1-.31V3c0-.41.34-.75.75-.75s.75.34.75.75v2.39C4.38 3.64 7.45 1.25 12 1.25c5.93 0 10.75 4.82 10.75 10.75 0 4.88-3.29 9.16-8.01 10.4-.06.01-.13.02-.19.02z" opacity=".4"/><path fill="C" d="M11.29 22.73c-.02 0-.05 0-.07-.01-1.07-.07-2.12-.31-3.12-.7a.751.751 0 01-.43-.97c.15-.38.59-.58.97-.43.86.34 1.77.54 2.69.61h.01c.4.02.7.36.7.76v.04a.76.76 0 01-.75.7zm-5.51-2.15c-.17 0-.33-.05-.47-.16-.84-.67-1.57-1.46-2.18-2.35a.73.73 0 01.19-1.04.76.76 0 011.04.19c.53.77 1.16 1.45 1.89 2.02.17.14.28.35.28.58 0 .17-.05.34-.16.48-.14.18-.36.28-.59.28zM2.44 15.7c-.33 0-.62-.21-.71-.52-.32-1.03-.48-2.1-.48-3.18 0-.41.34-.75.75-.75s.75.34.75.75c0 .93.14 1.85.41 2.73.02.07.03.15.03.23 0 .33-.21.61-.52.71-.08.02-.15.03-.23.03z"/><path fill="C" d="M12 16a4 4 0 100-8 4 4 0 000 8z" opacity=".4"/>',
  timer: '<path opacity=".4" d="M12 22a8.67 8.67 0 1 0 0-17.34A8.67 8.67 0 0 0 12 22Z" fill="C"/><path d="M12 13.75c-.41 0-.75-.34-.75-.75V8c0-.41.34-.75.75-.75s.75.34.75.75v5c0 .41-.34.75-.75.75ZM14.89 3.45H9.11c-.4 0-.72-.32-.72-.72 0-.4.32-.73.72-.73h5.78c.4 0 .72.32.72.72 0 .4-.32.73-.72.73Z" fill="C"/>',
  task: '<path opacity=".4" d="M14.19.969H5.81C2.17.969 0 3.139 0 6.779v8.38c0 3.64 2.17 5.81 5.81 5.81h8.38c3.64 0 5.81-2.17 5.81-5.81v-8.38c0-3.64-2.17-5.81-5.81-5.81Z" fill="C" transform="translate(2 1)"/><path d="M16.31 7.84c0 .41-.33.75-.75.75h-5.25c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h5.25c.42 0 .75.34.75.75ZM7.97 6.867l-2.25 2.25c-.15.15-.34.22-.53.22s-.39-.07-.53-.22l-.75-.75c-.3-.29-.3-.77 0-1.06.29-.29.76-.29 1.06 0l.22.22 1.72-1.72c.29-.29.76-.29 1.06 0 .29.29.29.77 0 1.06ZM16.31 14.84c0 .41-.33.75-.75.75h-5.25c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h5.25c.42 0 .75.34.75.75ZM7.97 13.867l-2.25 2.25c-.15.15-.34.22-.53.22s-.39-.07-.53-.22l-.75-.75c-.3-.29-.3-.77 0-1.06.29-.29.76-.29 1.06 0l.22.22 1.72-1.72c.29-.29.76-.29 1.06 0 .29.29.29.77 0 1.06Z" fill="C" transform="translate(2 1)"/>',
  people: '<path opacity=".4" d="M17.53 7.77a.739.739 0 0 0-.21 0 2.874 2.874 0 0 1-2.78-2.88C14.54 3.3 15.83 2 17.43 2c1.59 0 2.89 1.29 2.89 2.89a2.89 2.89 0 0 1-2.79 2.88ZM20.792 14.7c-1.12.75-2.69 1.03-4.14.84.38-.82.58-1.73.59-2.69 0-1-.22-1.95-.64-2.78 1.48-.2 3.05.08 4.18.83 1.58 1.04 1.58 2.75.01 3.8ZM6.438 7.77c.07-.01.14-.01.21 0a2.874 2.874 0 0 0 2.78-2.88C9.428 3.3 8.138 2 6.538 2c-1.59 0-2.89 1.29-2.89 2.89a2.89 2.89 0 0 0 2.79 2.88ZM6.551 12.85c0 .97.21 1.89.59 2.72-1.41.15-2.88-.15-3.96-.86-1.58-1.05-1.58-2.76 0-3.81 1.07-.72 2.58-1.01 4-.85-.41.84-.63 1.79-.63 2.8Z" fill="C"/><path d="M12.12 15.87a1.13 1.13 0 0 0-.26 0 3.425 3.425 0 0 1-3.31-3.43c0-1.9 1.53-3.44 3.44-3.44 1.9 0 3.44 1.54 3.44 3.44 0 1.86-1.46 3.37-3.31 3.43ZM8.87 17.94c-1.51 1.01-1.51 2.67 0 3.67 1.72 1.15 4.54 1.15 6.26 0 1.51-1.01 1.51-2.67 0-3.67-1.71-1.15-4.53-1.15-6.26 0Z" fill="C"/>',
} as const

export type IconName = keyof typeof ICONSAX

export const icon = (name: IconName, color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${ICONSAX[name].replaceAll('"C"', `"${color}"`)}</svg>`

// Toys: one soft blob per agent, its color fixed by its id.
const PALETTE = ['#F2EDE6', '#FFD6A5', '#CDE7FF', '#D7F5D0', '#F9D0E3', '#E3D9FF', '#FFF1A8', '#C9F1EC']
export const MAIN_COLOR = '#D97757'

export const colorFor = (id: string): string => {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length] ?? PALETTE[0]!
}

export type ToyMood = 'working' | 'idle' | 'done'

/**
 * A boxy critter in the spirit of Claude's mascot: square body, side nubs, four legs.
 * Working: it walks (legs alternate, body bobs) and blinks. Done: eyes shut, faded.
 */
export const toy = (color: string, mood: ToyMood): string => {
  const eyes =
    mood === 'done'
      ? '<path d="M20 22h5M35 22h5" stroke="#2a2522" stroke-width="2.4" stroke-linecap="round"/>'
      : `<rect x="20" y="17" width="4" height="8" rx="1" fill="#2a2522">${BLINK}</rect><rect x="36" y="17" width="4" height="8" rx="1" fill="#2a2522">${BLINK}</rect>`
  const walking = mood === 'working'
  const step = (begin: string) =>
    walking
      ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.5s" begin="${begin}" repeatCount="indefinite"/>`
      : ''
  const bob = walking
    ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.5;0 0" dur="0.25s" repeatCount="indefinite"/>'
    : ''
  const leg = (x: number) => `<rect x="${x}" y="36" width="5" height="9" rx="1" fill="${color}"/>`
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 52">' +
    `<ellipse cx="30" cy="48" rx="20" ry="2.4" fill="#000" opacity="${walking ? '.18' : '.3'}"/>` +
    `<g opacity="${mood === 'done' ? '.7' : '1'}">` +
    `<g>${step('0s')}${leg(13)}${leg(33)}</g>` +
    `<g>${step('0.25s')}${leg(22)}${leg(42)}</g>` +
    `<g>${bob}` +
    `<rect x="3" y="18" width="7" height="8" rx="1" fill="${color}"/>` +
    `<rect x="50" y="18" width="7" height="8" rx="1" fill="${color}"/>` +
    `<rect x="9" y="5" width="42" height="33" rx="3" fill="${color}"/>` +
    `${eyes}</g></g></svg>`
  )
}

const BLINK =
  '<animate attributeName="height" values="8;8;1;8" keyTimes="0;0.92;0.96;1" dur="3.4s" repeatCount="indefinite"/>'

/** A thin rounded progress bar. */
export const bar = (done: number, total: number): string => {
  const w = total === 0 ? 0 : Math.round((done / total) * 200)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 6"><rect width="200" height="6" rx="3" fill="#ffffff" opacity=".12"/><rect width="${w}" height="6" rx="3" fill="#4CC38A"/></svg>`
}

// Status glyphs in the app's own todo style: grey filled check, spinning arc, dashed ring.
export const statusGlyph = {
  completed: icon('tick', '#B9B4AC'),
  in_progress:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>' +
    '<path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="#ECE9E4" stroke-width="2" stroke-linecap="round">' +
    '<animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite"/></path></svg>',
  pending:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#9A968F" stroke-width="1.6" stroke-dasharray="2.6 2.6"/></svg>',
} as const
