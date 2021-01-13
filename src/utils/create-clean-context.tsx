import React, {
  createContext,
  useEffect,
  useContext,
  useState,
  useRef
} from 'react'
import { shallowEqual } from 'shallow-utils'
import { createActionUtils } from './createHookPortal'

export const createCleanContext = <T extends any>(defaultValue: T) => {
  const ctx = createContext(defaultValue)
  const { Provider: DefaultProvider, Consumer } = ctx
  let getState = () => (null as any) as T
  const { HooksWrapper, subscribeToHookState } = createActionUtils({})
  const useContextSelector = <Selector extends (state: T) => any>(
    selector: Selector
  ) => {
    const [state, setState] = useState(() => {
      return selector(getState())
    })
    const selectorRef = useRef(selector)
    const stateRef = useRef(state)
    stateRef.current = state
    useEffect(() => {
      const useNoisyContext = () => {
        return useContext(ctx)
      }
      const subsc = subscribeToHookState(
        useNoisyContext,
        (ctxState) => {
          const newState = selectorRef.current(ctxState)
          // eslint-ignore-next-line
          const isEqual = shallowEqual(
            { val: newState },
            { val: stateRef.current }
          )

          if (isEqual) {
            return
          }
          setState(newState)
        },
        'useNoisyContextSubscription'
      )
      return subsc.unsubscribe
    }, [])
    return state as ReturnType<Selector>
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
