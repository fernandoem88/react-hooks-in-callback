declare module 'app-types' {
  export interface Dictionary<T = any> {
    [K: string]: T
  }

  export type Resolver = <S>(state: S, force?: boolean) => void

  export interface Helpers {
    getResolver: (id: string) => Resolver
    addResolver: (id: string, resolver: Resolver) => void
    deleteResolver: (id: string) => void
    getHook: (id: string) => () => any
    addHook: (hook: () => any, id: string) => void
    deleteHook: (id: string) => void
  }
  export interface Action {
    type: 'ADD' | 'DELETE'
    payload: string
  }
  export interface Store {
    helpers: Helpers
    dispatch: (action: Action) => void
    hooks: { [id: string]: () => any }
  }
}

declare module 'shallow-utils' {
  export function shallowEqual<T extends any>(v1: T, v2: T): boolean
  export function shallowEqualExcept(): any
  export function shallowItemsDifferExcept(): any
}

declare module 'uniqid'
