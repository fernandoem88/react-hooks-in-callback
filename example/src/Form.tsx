import React from "react";
import { useFormikContext, Form, Formik } from "formik";
import { useHooksInCallback } from "react-hooks-in-callback";
import { MyField } from "./Field";

const mainStyle = {};
const h1Style = {};
const btnStyle = {};
const names = ["pippo", "pluto", "songolo", "pakala"];

export const MyForm = () => {
  const [HooksWrapper, getHookState] = useHooksInCallback();
  return (
    <Formik>
      <div>
        <HooksWrapper />
        <div style={mainStyle}>
          <h1 style={h1Style}>Formik test</h1>
          <button
            style={btnStyle}
            onClick={async () => {
              const formik = await getHookState(useFormikContext);
              formik.submitForm();
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
  );
};
