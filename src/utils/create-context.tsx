import React, { useEffect, useContext, useState, useRef } from 'react'
import { shallowEqual } from 'shallow-utils'
import { createActionUtils } from './createHookPortal'
import { useForceUpdate } from '../hooks'

export const createContext = <T extends any>(defaultValue: T) => {
  const ctx = React.createContext(defaultValue)
  const { Provider: DefaultProvider, Consumer } = ctx
  let getState = () => (null as any) as T
  const { HooksWrapper, subscribeToHookState } = createActionUtils({})
  const useContextSelector = <Selector extends (state: T) => any>(
    selector: Selector
  ) => {
    const [state] = useState(() => {
      return selector(getState())
    })
    const selectorRef = useRef(selector)
    selectorRef.current = selector
    const stateRef = useRef(state)
    const shouldCheckEqualityInComponent = useRef(false)
    if (shouldCheckEqualityInComponent.current) {
      // when the component itself re-renders but not because of a context update
      const newState = selector(getState())
      const isEqual = shallowEqual(
        { value: newState },
        { value: stateRef.current }
      )
      if (!isEqual) {
        stateRef.current = newState
      }
    } else {
      shouldCheckEqualityInComponent.current = true
    }
    const forceUpdate = useForceUpdate()
    useEffect(() => {
      const useNoisyContext = () => {
        return useContext(ctx)
      }
      const subsc = subscribeToHookState(
        useNoisyContext,
        (ctxState) => {
          const newState = selectorRef.current(ctxState)
          const isEqual = shallowEqual(
            { value: newState },
            { value: stateRef.current }
          )
          if (isEqual) {
            return
          }
          // we already check the shallow equal here
          shouldCheckEqualityInComponent.current = false
          stateRef.current = newState
          forceUpdate()
        },
        'useReactContextInUseEffect'
      )
      return () => {
        subsc.unsubscribe()
      }
    }, [])
    return stateRef.current as ReturnType<Selector>
  }
  const Provider: React.FC<{ value: T }> = (props) => {
    getState = () => props.value
    useEffect(() => {
      return () => {
        getState = () => (null as any) as T
      }
    }, [])
    return (
      <DefaultProvider value={props.value}>
        <HooksWrapper />
        {props.children}
      </DefaultProvider>
    )
  }
  const cleanCtx = { Provider, Consumer } as React.Context<T>
  return {
    ...cleanCtx,
    useContextSelector
  }
}
