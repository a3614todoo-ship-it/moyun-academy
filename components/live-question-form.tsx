"use client";

import { useActionState, useRef } from "react";
import {
  createLiveQuestion,
  type LiveQuestionActionState,
} from "@/app/courses/[slug]/live/actions";

type Props = {
  slug: string;
  token: string;
};

export function LiveQuestionForm({ slug, token }: Props) {
  const initialState: LiveQuestionActionState = { message: "" };
  const [state, formAction, pending] = useActionState(createLiveQuestion, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="live-question-form"
      ref={formRef}
    >
      <input name="slug" type="hidden" value={slug} />
      <input name="token" type="hidden" value={token} />
      <label>
        <span>提出你的問題</span>
        <textarea
          maxLength={500}
          name="body"
          placeholder="可以問文本、典故、人生處境，或想請老師延伸說明的地方..."
          required
          rows={4}
        />
      </label>
      {state.message ? (
        <p className={state.ok ? "form-success" : "form-message"}>{state.message}</p>
      ) : null}
      <button className="button button-gold button-block" disabled={pending} type="submit">
        {pending ? "送出中..." : "送出提問"}
      </button>
    </form>
  );
}
