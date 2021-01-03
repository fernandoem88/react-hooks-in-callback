declare module 'react-hooks-in-callback' {
  export type ResolverUtils<State> = {
    resolve: (state: State) => void
    reject: (error: any) => void
    isBeforeUnmount: boolean
  }
  export type Resolver<State> = (
    state: State,
    utils: ResolverUtils<State>
  ) => void
  type GetHookState = <Hook extends () => any>(
    hook: Hook,
    resolver?: Resolver<ReturnType<Hook>> | undefined,
    name?: string | undefined
  ) => Promise<ReturnType<Hook>>

  export type GetConfig<Config = any> = () => Config
  export type SetConfig<Config> = (modify: (config: Config) => Config) => void
  export type HooksHandlerWrapper = React.FC<{ children?: undefined }>
  export type UseConfig<Config> = <R extends unknown = Config>(
    selector?: ((config: Config) => R) | undefined
  ) => R

  export const useHooksInCallback: () => [
    React.FC<{
      children?: undefined
    }>,
    <Hook extends () => any>(
      hook: Hook,
      resolver?: Resolver<ReturnType<Hook>> | undefined,
      name?: string | undefined
    ) => Promise<ReturnType<Hook>>
  ]

  export const createActionUtils: <Config extends Record<any, any>>(
    config: Config
    // options?:
    //   | {
    //       persistable?:
    //         | {
    //             domain?: string | undefined;
    //             key: string;
    //             merge: (
    //               currentConfig: Config,
    //               localStorageConfig: Config | undefined
    //             ) => Config;
    //           }
    //         | undefined;
    //     }
    //   | undefined
  ) => {
    getHookState: GetHookState
    getConfig: GetConfig<Config>
    setConfig: SetConfig<Config>
    useConfig: UseConfig<Config>
    hooksHandlerWrapper: HooksHandlerWrapper
  }
}
