import { Subject } from 'rxjs'
import uniqid from 'uniqid'
// eslint-disable-next-line
import { StoreAction, Dictionary, Channel, StoreActionKeys } from 'types'

export const createStore = () => {
  const $store = new Subject<StoreAction<any>>()
  const storeState = {
    state: { ids: [] as string[], byId: {} as Dictionary<Channel> }
  }
  const boundState = {
    handlerId: undefined as string | undefined
  }
  let isBoundToAnHandler = false
  const bindToHooksHandler = (handlerId: string) => {
    if (boundState.handlerId)
      throw new Error('there is already a HooksConsummer bound to this store')
    boundState.handlerId = handlerId
    isBoundToAnHandler = true
  }
  const unbindToHooksHandler = (handlerId: string) => {
    if (boundState.handlerId !== handlerId)
      throw new Error(
        'unbindToHooksHandler cannot be executed: incorrect handlerId'
      )
    boundState.handlerId = undefined
    isBoundToAnHandler = false
  }
  $store.subscribe((action) => {
    if (action.type === 'BIND_TO_HOOKS_HANDLER') {
      bindToHooksHandler(action.payload)
    } else if (action.type === 'UNBIND_TO_HOOKS_HANDLER') {
      unbindToHooksHandler(action.payload)
    }
  })

  const getChannelHelpers = (channelId: string) => {
    const handleChannelMount = <S>(
      action: StoreAction<any>,
      callback: (action: StoreAction<'ON_CHANNEL_MOUNTED'>) => S
    ) => {
      if (action.type === 'ON_CHANNEL_MOUNTED') {
        return callback(action)
      }
      return null
    }

    const unmountChannel = () => {
      $store.next({
        type: 'UNMOUNT_CHANNEL',
        payload: { channelId }
      } as StoreAction<'UNMOUNT_CHANNEL'>)
    }

    const dispatchNewChannelParams = (params: any[]) => {
      $store.next({
        type: 'NEW_CHANNEL_PARAMS',
        payload: { channelId, params }
      } as StoreAction<'NEW_CHANNEL_PARAMS'>)
    }

    const handleNewChannelParams = <S>(
      action: StoreAction<any>,
      callback: (action: StoreAction<'NEW_CHANNEL_PARAMS'>) => S
    ) => {
      if (action.type === 'NEW_CHANNEL_PARAMS') {
        callback(action)
      }
    }

    const handleNewChannelState = <S>(
      action: StoreAction<any>,
      callback: (action: StoreAction<'NEW_CHANNEL_STATE'>) => S
    ) => {
      if (action.type === 'NEW_CHANNEL_STATE') {
        callback(action)
      }
    }
    return {
      onProviderUnmount,
      unmountChannel,
      dispatchNewChannelParams,
      handleChannelMount,
      handleNewChannelParams,
      handleNewChannelState
    }
  }

  const addChannel = <Hook extends (...params: any) => any>(
    hook: Hook,
    name?: string
  ) => {
    if (!isBoundToAnHandler) {
      throw new Error('cannot add a new chanel: store not bound to a provider')
    }
    const channelId = uniqid('ChannelId__')
    storeState.state.ids.push(channelId)
    storeState.state.byId[channelId] = { id: channelId, hook, name }

    const mountChannel = () => {
      $store.next({
        type: 'MOUNT_CHANNEL',
        payload: { channelId }
      } as StoreAction<'MOUNT_CHANNEL'>)
    }

    return {
      channelId,
      helpers: {
        mountChannel,
        ...getChannelHelpers(channelId)
      }
    }
  }

  const onProviderUnmount = (callback: () => void) => {
    return $store.subscribe(
      ({ type }: StoreAction<'UNBIND_TO_HOOKS_HANDLER'>) => {
        if (type === 'UNBIND_TO_HOOKS_HANDLER') {
          callback()
        }
      }
    )
  }

  const removeChannel = (channelId: string) => {
    storeState.state.ids = storeState.state.ids.filter((id) => id !== channelId)
    delete storeState.state.byId[channelId]
  }

  const resetStore = (persistKey?: string) => {
    storeState.state = { byId: {}, ids: [] }
    if (persistKey) {
      deleteLocalStorageItem(persistKey)
    }
  }

  const initialLocalStorage = {
    name: 'HOOKS_CONTEXT',
    states: {} as { [K: string]: typeof storeState['state'] }
  }

  const getLocalStorage = (): typeof initialLocalStorage => {
    const lsData = localStorage.getItem(initialLocalStorage.name)
    return lsData
      ? JSON.parse(lsData)
      : {
          ...initialLocalStorage,
          states: {}
        }
  }

  // const persistStoreState = (key: string) => {
  //   const lsData = getLocalStorage()
  //   lsData.states[key] = storeState.state
  //   localStorage.setItem(initialLocalStorage.name, JSON.stringify(lsData))
  // }

  // const getLocalStorageItem = (key: string) => {
  //   const lsData = getLocalStorage()
  //   return lsData.states[key] || { byId: {}, ids: [] }
  // }

  const deleteLocalStorageItem = (key: string) => {
    const lsData = getLocalStorage()
    delete lsData.states[key]
    localStorage.setItem(lsData.name, JSON.stringify(lsData))
  }

  const store = {
    dispatch: <K extends StoreActionKeys>(action: StoreAction<K>) => {
      $store.next(action)
    },
    subscribe: <S extends any>(subscriber: (action: StoreAction<any>) => S) => {
      return $store.subscribe((action) => {
        subscriber(action)
      })
    },
    getChannels: () => storeState.state,
    getChannelById: (id: string) => storeState.state.byId[id],
    getIsBoundToAProvider: () => isBoundToAnHandler,
    addChannel,
    removeChannel,
    getChannelHelpers,
    onProviderUnmount,
    resetStore
  }

  return store
}

export type Store = ReturnType<typeof createStore>
