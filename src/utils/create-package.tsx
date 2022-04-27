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
    mounted: false,
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
    store.dispatch({ type: 'DELETE', payload: id })
    delete store.hooks[id]
  }

  const getHookState = <S,>(
    hook: () => S,
    suspender?: (
      state: S,
      utils: {
        resolve: () => void
        reject: (err?: any) => void
        isBeforeUnmount: boolean
      }
    ) => void
  ) => {
    if (!store.mounted) {
      const errMsg = `HooksWrapper should be mounted as first component under
      your provider components tree.
      This error occures because, either you forgot to mount it or it was already unmounted.`
      // throw new Error(errMsg)
      console.error(errMsg)
      return Promise.resolve(undefined) as Promise<any>
    }
    const id = uniqid('hook--')
    store.helpers.addHook(hook, id)

    let resolved = false
    const hookPromise = new Promise<S>((resolve, reject) => {
      const doResolve = (value: S) => {
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
            resolve: () => doResolve(value),
            reject: (err?: any) => {
              resolved = true
              reject(err)
            },
            isBeforeUnmount
          })
          return
        }
        doResolve(value)
      }
      store.helpers.addResolver(id, resolver)
    })

    return hookPromise
  }

  const subscribeToHookState = <S,>(
    hook: () => S,
    subscriber: (
      error: { message: string } | null,
      data: {
        state: S
        isBeforeUnmount: boolean
      }
    ) => void
  ) => {
    let unsubscribed = false
    let utils: any
    getHookState(hook, (state, ut) => {
      if (!utils) {
        utils = ut
      }
      if (unsubscribed) {
        ut.resolve()
        return
      }
      subscriber(null, { state, isBeforeUnmount: !!ut.isBeforeUnmount })
    }).catch((err: any) => {
      const errData = {
        message:
          typeof err === 'string' ? err : err?.message || 'something went wrong'
      }
      subscriber(errData, null as any)
      utils && utils.reject(errData.message)
      unsubscribed = true
    })
    const unsubscribe = () => {
      utils && utils.resolve()
      unsubscribed = true
    }
    return { unsubscribe }
  }

  const getStore = () => store

  return {
    HooksWrapper: React.memo(() => (
      <HooksWrapper getStore={getStore} />
    )) as React.FC<{}>,
    getHookState,
    subscribeToHookState
  }
}
