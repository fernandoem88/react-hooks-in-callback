import React from 'react'
import { useFormikContext } from 'formik'
import { useHooksInCallback } from 'react-hooks-in-callback'

const mainStyle = {
  padding: 2,
  border: 'solid 1px gray',
  margin: 4,
  cursor: 'default',
  userSelect: 'none'
} as any
const font15 = { fontSize: 15 }
const clickStyle = { fontWeight: 'bold', fontSize: 24 } as any
const renderStyle = { ...clickStyle, color: 'red' } as any

// const { HooksWrapper, getHookState } = createActionsPackage()

export const MyField = ({ name }: { name: string }) => {
  const rerenderRef = React.useRef(-1)
  rerenderRef.current += 1
  // value is updated on each click event.
  const [value, setValue] = React.useState(() => 0)
  const [HooksWrapper, getHookState] = useHooksInCallback()

  return (
    <div
      style={mainStyle}
      onClick={async () => {
        const formik = await getHookState(useFormikContext)
        const nextValue = value + 1
        setValue((v) => v + 1)
        formik.setFieldValue(name, nextValue)
      }}
    >
      <HooksWrapper />
      <div>{name}</div>
      <div style={font15}>
        Total Clicks:&nbsp;&nbsp;
        <span style={clickStyle}>{value}</span>
      </div>
      <div style={font15}>
        Total Re-renders:&nbsp;&nbsp;
        <span style={renderStyle}>{rerenderRef.current}</span>
      </div>
    </div>
  )
}

export default React.memo(MyField)
