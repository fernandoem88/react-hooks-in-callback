import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
const useForceUpdate = () => {
  const [io, setIO] = useState(true)
  const ioRef = useRef(io)
  useEffect(() => {
    ioRef.current = io
  })
  const forceUpdate = useCallback(() => setIO(!ioRef.current), [])
  const state = useMemo(() => [forceUpdate, io], [forceUpdate, io])
  return state as [() => void, boolean]
}

export default useForceUpdate
