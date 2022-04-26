import React from 'react'
import { Store, Resolver, Helpers } from 'app-types'
import { HooksWrapper } from '../components/HooksWrapper'

export const uniqid = (str: string = '') => {
  const dateId = str + new Date().getTime()
  const randmId = '_' + Math.random().toString(36).substring(2, 9)
  return dateId + randmId
}

export const createActionsPackage = () => {
  const store: Store = {
    helpers: {} as Helpers,
    dispatch: () => {},
    hooks: {}
  }
  store.helpers.addHook = (hook, id) => {
    store.hooks[id] = hook
    store.dispatch({ type: 'ADD', payload: id })
  }
  store.helpers.getHook = (id) => {
    return store.hooks[id]
  }
  store.helpers.deleteHook = (id) => {
    delete store.hooks[id]
  }

  const getHookState = <S,>(
    hook: () => S,
    suspender?: (
      state: S,
      utils: {
        resolve: (state: S) => void
        isBeforeUnmount: boolean
        reject: (err?: any) => void
      }
    ) => boolean
  ) => {
    const id = uniqid('hook--')
    store.helpers.addHook(hook, id)

    let resolved = false
    const hookPromise = new Promise<S>((resolve, reject) => {
      const finalResolve = (value: S) => {
        resolved = true
        resolve(value)
        store.helpers.deleteResolver(id)
        store.helpers.deleteHook(id)
      }
      const resolver: Resolver = (
        value: any,
        isBeforeUnmount: boolean = false
      ) => {
        if (resolved) {
          return
        }
        if (suspender) {
          suspender(value, {
            resolve: finalResolve,
            isBeforeUnmount,
            reject
          })
          return
        }
        finalResolve(value)
      }
      store.helpers.addResolver(id, resolver)
    })

    return hookPromise
  }

  const subscribe = <S,>(
    hook: () => S,
    subscriber: (state: S, error?: any) => void
  ) => {
    let unsubscribed = false
    getHookState(hook, (state) => {
      subscriber(state)
      return unsubscribed
    }).catch((err) => {
      subscriber(null as any, err)
    })
    const unsubscribe = () => {
      unsubscribed = true
    }
    return unsubscribe
  }

  const getStore = () => store

  return {
    HooksWrapper: React.memo(() => <HooksWrapper getStore={getStore} />),
    getHookState,
    subscribeToHookState: subscribe
  }
}
