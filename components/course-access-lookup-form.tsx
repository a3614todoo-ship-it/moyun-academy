"use client";

import { useActionState } from "react";
import {
  lookupCourseAccess,
  type CourseAccessLookupState,
} from "@/app/courses/[slug]/access/actions";

type Props = {
  slug: string;
};

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className="field-error">{errors[0]}</span> : null;
}

export function CourseAccessLookupForm({ slug }: Props) {
  const initialState: CourseAccessLookupState = { message: "" };
  const [state, formAction, pending] = useActionState(lookupCourseAccess, initialState);

  return (
    <form action={formAction} className="course-access-lookup">
      <input name="slug" type="hidden" value={slug} />
      <div>
        <h4>已購買課程？</h4>
        <p>輸入購買編號與報名 Email，就可以重新進入學習教室。</p>
      </div>
      <label>
        <span>課程購買編號</span>
        <input
          aria-invalid={Boolean(state.fieldErrors?.purchaseNo)}
          name="purchaseNo"
          placeholder="CP202606240001"
          required
        />
        <ErrorText errors={state.fieldErrors?.purchaseNo} />
      </label>
      <label>
        <span>報名 Email</span>
        <input
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
        <ErrorText errors={state.fieldErrors?.email} />
      </label>
      {state.message ? <p className="form-message">{state.message}</p> : null}
      <button className="button button-outline button-block" disabled={pending} type="submit">
        {pending ? "查詢中..." : "進入學習教室"}
      </button>
    </form>
  );
}
