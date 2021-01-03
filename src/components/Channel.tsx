import React, { useState } from 'react'
import { Store } from '../utils/store' // eslint-disable-line

const Channel: React.FC<{
  id: string
  getStore: () => Store
  name: string
}> = React.memo(function Channel(props) {
  const [store] = useState(props.getStore)
  const [useChannelHook] = useState(() => store.getChannelById(props.id).hook)
  useChannelHook()
  return <React.Fragment />
})

export default Channel
