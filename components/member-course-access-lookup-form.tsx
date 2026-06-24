"use client";

import { useActionState } from "react";
import {
  lookupMemberCourseAccess,
  type MemberCourseAccessLookupState,
} from "@/app/courses/[slug]/member-access/actions";

type Props = {
  slug: string;
};

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className="field-error">{errors[0]}</span> : null;
}

export function MemberCourseAccessLookupForm({ slug }: Props) {
  const initialState: MemberCourseAccessLookupState = { message: "" };
  const [state, formAction, pending] = useActionState(lookupMemberCourseAccess, initialState);

  return (
    <form action={formAction} className="course-access-lookup">
      <input name="slug" type="hidden" value={slug} />
      <div>
        <h4>已是會員？</h4>
        <p>輸入會員申請編號與 Email，就可以進入會員免費課程。</p>
      </div>
      <label>
        <span>會員申請編號</span>
        <input
          aria-invalid={Boolean(state.fieldErrors?.applicationNo)}
          name="applicationNo"
          placeholder="CL202606240001"
          required
        />
        <ErrorText errors={state.fieldErrors?.applicationNo} />
      </label>
      <label>
        <span>會員 Email</span>
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
