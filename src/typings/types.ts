declare module 'types' {
  export interface Dictionary<T = any> {
    [K: string]: T
  }
  export interface StoreActionPayloads {
    /**
     * @description sent to the provider to mount a new scope
     */
    MOUNT_CHANNEL: {
      channelId: string
      name?: string
    }
    ON_CHANNEL_MOUNTED: {
      channelId: string
    }
    /**
     * @description sent to the provider to unmount the scope
     */
    UNMOUNT_CHANNEL: {
      channelId: string
    }

    NEW_CHANNEL_PARAMS: {
      channelId: string
      params: any[]
    }

    NEW_CHANNEL_STATE: {
      channelId: string
      state: any
    }

    BIND_TO_HOOKS_HANDLER: { handlerId: string }
    UNBIND_TO_HOOKS_HANDLER: { handlerId: string }
  }
  export type StoreActionKeys = keyof StoreActionPayloads
  export interface StoreAction<K extends StoreActionKeys> {
    type: K
    payload: StoreActionPayloads[K]
  }
  export interface Channel {
    id: string
    hook: Function
    name?: string
  }

  //
  export type ResolverUtils<State> = {
    resolve: (state: State) => void
    reject: (error: any) => void
    isBeforeUnmount: boolean
  }
  export type Resolver<State> = (
    state: State,
    utils: ResolverUtils<State>
  ) => void
  export type GetHookState = <Hook extends () => any>(
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
}

declare module 'shallow-utils' {
  export function shallowEqual<T extends any>(v1: T, v2: T): boolean
  export function shallowEqualExcept(): any
  export function shallowItemsDifferExcept(): any
}

declare module 'uniqid'
