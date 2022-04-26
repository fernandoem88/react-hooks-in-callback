import React from 'react'
import { useFormikContext, Form, Formik } from 'formik'
import {
  // useHooksInCallback,
  createActionsPackage
} from 'react-hooks-in-callback'
import { MyField } from './Field'

const mainStyle = {}
const h1Style = {}
const btnStyle = {}
const names = ['pippo', 'pluto', 'songolo', 'pakala']
const { HooksWrapper, getHookState } = createActionsPackage()
export const MyForm = function MyForm() {
  // const [HooksWrapper, getHookState] = useHooksInCallback()

  return (
    <Formik
      initialValues={{ pippo: 0, pluto: 0, songolo: 0, pakala: 0 }}
      onSubmit={(values) => {
        const obj = Object.entries(values).reduce((prev, entry) => {
          const [k, v] = entry
          return `${prev}\n${k}: ${v}`
        }, '')
        alert(obj)
      }}
    >
      <div>
        pippo
        <HooksWrapper />
        <div style={mainStyle}>
          <h1 style={h1Style}>Formik test</h1>
          <button
            style={btnStyle}
            onClick={async () => {
              const formik = await getHookState(useFormikContext)
              formik.submitForm()
            }}
          >
            Submit
          </button>
        </div>
        <Form>
          {names.map((name) => (
            <MyField key={name} name={name} />
          ))}
        </Form>
      </div>
    </Formik>
  )
}

export default React.memo(MyForm)
