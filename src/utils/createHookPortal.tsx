/**
 * @author Fernando Ekutsu Mondele,
 * Senior Frontend Developer at Testbirds GMBH, Munich
 * December 2020.
 * react-hooks-in-callback
 * @description
 * - isolate noisy hooks (unwanted re-renders) from your component
 * - you can use your own hooks in each callback:
 * for example useDispatch, useHistory, etc. without affecting your component.
 * - in an async action, any changes regarding a react hook will be done in one place, no need to pass hook values as parameters.
 * @example
 * const useActionUtils = () => {
 *    const history = useHistory()
 *    const { getState, dispatch } = useStore();
 *  return { history, dispatch, getState };
 * }
 * const actionTest = async () => {
 *    const { dispatch, history } = await getHookState(useActionUtils);
 *    history.push("/test")
 *    dispatch({type: "test"});
 *    dispatch({type: "test2"});
 * }
 */
import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { Subject } from 'rxjs'

import produce from 'immer'
import { createStore } from './store'
import HooksHandler from '../components/HooksHandler'
import { shallowEqual } from 'shallow-utils'
import useForceUpdate from '../hooks/useForceUpdate'
// eslint-disable-next-line
import { Resolver } from 'types'

const copy = <V,>(value: V) => produce(value, () => {}) as V

export const createActionUtils = <Config extends Record<any, any>>(
  config: Config
  // options?: {
  //   persistable?: {
  //     /**
  //      * @example window.location.origin | dev | prod
  //      * */
  //     domain?: string;
  //     key: string;
  //     merge: (
  //       currentConfig: Config,
  //       localStorageConfig: Config | undefined
  //     ) => Config;
  //   };
  // }
) => {
  const configState = { state: config }

  const $config = new Subject<{ type: 'CONFIG_UPDATED' }>()

  const getConfig = () => copy(configState.state)
  const setConfig = (modify: (config: Config) => Config) => {
    const newConfig = produce(getConfig(), (draft) => {
      return modify(draft as Config)
    })
    configState.state = newConfig as Config
    $config.next({ type: 'CONFIG_UPDATED' })
  }
  const useConfig = <R extends any = Config>(
    selector: (config: Config) => R = ((config: Config) => config) as any
  ) => {
    const forceUpdate = useForceUpdate()
    useEffect(() => {
      // side effects
      const sub = $config.subscribe((action: any) => {
        if (action.type === 'CONFIG_UPDATED') {
          const newConfig = getConfig()
          const isEqual = shallowEqual(newConfig, stateRef.current)
          if (isEqual) return
          stateRef.current = newConfig
          forceUpdate()
        }
      })
      // cleanup
      return () => {
        sub.unsubscribe()
      }
    }, [forceUpdate])

    const selectConfig = useCallback(selector, [])
    const stateRef = useRef<Config>()
    const newConfig = stateRef.current
    return useMemo(() => selectConfig(newConfig || getConfig()), [
      newConfig,
      selectConfig
    ]) as R
  }

  const store = createStore()
  const getHookState = <Hook extends () => any>(
    hook: Hook,
    resolver?: Resolver<ReturnType<Hook>>,
    name?: string
  ) => {
    const useProvidedHook = hook
    let resolved = false
    const hookName = name

    return new Promise<ReturnType<Hook>>((resolve, reject) => {
      let mounted = true
      const doUnmount = () => {
        if (mounted) {
          mounted = false
          channelHelpers.unmountChannel()
          store.removeChannel(channelId)
        }
      }

      const doOnProviderUnmount = () => {
        return channelHelpers.onProviderUnmount(() => {
          const state = getState()
          doResolve(state, true)
        })
      }
      const doResolve = (
        state: ReturnType<Hook>,
        isBeforeUnmount: boolean = false
      ) => {
        if (!resolver) {
          resolved = true
          resolve(state)
          doUnmount()
          return
        }
        resolver(state, {
          resolve: (inputState) => {
            resolved = true
            resolve(inputState)
            doUnmount()
          },
          reject: (err: any) => {
            resolved = true
            reject(err)
            doUnmount()
          },
          isBeforeUnmount
        })
      }

      let getState = () => undefined as ReturnType<Hook>
      /**
       * @description
       */
      const useHooksWrapper = () => {
        const state = useProvidedHook() as ReturnType<Hook>
        getState = () => state
        useEffect(() => {
          // execute doResolve for every state
          doResolve(state)
        })
        useEffect(() => {
          const subscr = doOnProviderUnmount()
          return () => {
            // when the hook is about to unmount, if the promise is not resolved
            // execute doResolve for the last time so the user can handle it with isBeforeUnmount=true
            subscr.unsubscribe()
            if (!resolved) {
              const lastState = getState()
              doResolve(lastState, true)
            }
          }
        }, [])
        return undefined
      }
      const channelData = store.addChannel(useHooksWrapper, hookName)
      const { channelId, helpers: channelHelpers } = channelData
      channelHelpers.mountChannel()
    })
  }

  const getStore = () => store

  const HooksWrapper: React.FC<{ children?: undefined }> = React.memo(
    function HooksWrapper(props) {
      if (props.children) {
        throw new Error(
          `the HooksWrapper do not accept any children components
        and should be mounted as first child in the components tree`
        )
      }
      return <HooksHandler getStore={getStore} />
    }
  )

  const storeState = {
    getHookState,
    getConfig,
    setConfig,
    HooksWrapper,
    useConfig
  }
  return storeState
}
