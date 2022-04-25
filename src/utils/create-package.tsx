import React, { useRef, useMemo, useState, useReducer } from 'react'
import { Store, Action, Resolver, Helpers } from 'app-types'
import Channels from '../components/Channels'

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
  store.helpers.setHook = (hook, id) => {
    store.hooks[id] = hook
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
      store.helpers.setResolver(id, resolver)
    })

    store.helpers.setHook(hook, id)
    store.dispatch({ type: 'ADD', payload: id })

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
  const HooksWraper: React.FC<{ children?: undefined }> = (props) => {
    if (props.children !== undefined) {
      throw new Error(
        `the HooksWrapper do not accept any children components
        and should be mounted as first child in the components tree`
      )
    }
    const [ids, dispatch] = useReducer((ids: string[], action: Action) => {
      if (action.type === 'ADD') {
        return [...ids, action.payload]
      }
      if (action.type === 'DELETE') {
        return ids.filter((id) => id !== action.payload)
      }
      return ids
    }, [])

    return <Channels getStore={getStore} ids={ids} dispatch={dispatch} />
  }

  return {
    HooksWrapper: React.memo(HooksWraper) as React.FC,
    getHookState,
    subscribeToHookState: subscribe
  }
}
