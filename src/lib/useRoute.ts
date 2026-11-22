import { useSyncExternalStore } from 'react'

const ROUTES = ['closet', 'looks', 'lookbook'] as const
export type Route = (typeof ROUTES)[number]

/** With no page in the address, the app opens on Looks, where Today's look is. */
function currentRoute(): Route {
  const hash = window.location.hash.replace('#/', '')
  return ROUTES.find((route) => route === hash) ?? 'looks'
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

/** Keeps the page in the URL, so refresh and the back gesture both work. */
export const useRoute = () => useSyncExternalStore(subscribe, currentRoute)

export const goTo = (route: Route) => {
  window.location.hash = `/${route}`
}
