import React, { useState, useEffect, useMemo, useRef } from 'react'
import uniqid from 'uniqid'
import Channel from './Channel'

import { Store } from '../utils/store' // eslint-disable-line
import { Dictionary, StoreAction } from 'types' // eslint-disable-line

interface Props {
  getStore: () => Store
  children?: null
}
const HooksHandler: React.FC<Props> = React.memo(function HooksHandler(props) {
  const [store] = useState(props.getStore)
  const { dispatch, subscribe, getChannels, resetStore } = store
  const [channelIds, setChannelIds] = useState(() => getChannels().ids)

  useEffect(() => {
    const handlerId = uniqid('HandlerId__')
    dispatch({ type: 'BIND_TO_HOOKS_HANDLER', payload: { handlerId } })
    return () => {
      dispatch({
        type: 'UNBIND_TO_HOOKS_HANDLER',
        payload: { handlerId }
      })
    }
  }, [])

  const channelNamesRef = useRef({} as Dictionary<string | undefined>)
  useEffect(() => {
    const subs = subscribe(({ type, payload }: StoreAction<any>) => {
      if (type === 'MOUNT_CHANNEL') {
        const { channelId } = payload as StoreAction<'MOUNT_CHANNEL'>['payload']
        const { ids, byId } = getChannels()
        const channels = byId[channelId]
        channelNamesRef.current[channelId] = channels.name
        setChannelIds([...ids])
        return
      }
      if (type === 'UNMOUNT_CHANNEL') {
        const {
          channelId
        } = payload as StoreAction<'UNMOUNT_CHANNEL'>['payload']
        store.removeChannel(channelId)
        const [...newIds] = getChannels().ids
        setChannelIds(newIds)
      }
    })
    return () => {
      subs.unsubscribe()
    }
  }, [subscribe])

  const getStoreRef = useRef(props.getStore)

  const Channels = useMemo(() => {
    const channels = channelIds.map((id) => {
      const name = channelNamesRef.current[id] || ''
      return (
        <Channel
          getStore={getStoreRef.current}
          id={id}
          key={name ? name + '__' + id : id}
          name={name || 'UNKNOWN'}
        />
      )
    }) as React.ReactElement[]
    return <React.Fragment>{channels}</React.Fragment>
  }, [channelIds])
  useEffect(() => {
    return () => {
      resetStore()
    }
  }, [resetStore])

  return Channels
})

export default HooksHandler
