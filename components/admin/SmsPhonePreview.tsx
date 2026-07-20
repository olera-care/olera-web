"use client";

/**
 * Phone-style SMS preview primitives, shared by the Family Comms "SMS messages"
 * panel and the Automations per-job text samples. Pure presentation — bodies
 * come from lib/sms-samples.ts (which renders the LIVE templates).
 */

/** Highlight URLs the way a phone's SMS app auto-links them. */
export function BodyWithLinks({ body }: { body: string }) {
  const parts = body.split(/(https?:\/\/\S+|olera\.care\/\S+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^(https?:\/\/|olera\.care\/)/.test(p) ? (
          <span key={i} className="break-all text-sky-600 underline decoration-sky-300">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default function SmsPhonePreview({ body, senderLast4 }: { body: string; senderLast4?: string | null }) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border border-gray-200 bg-white px-4 pb-7 pt-5 shadow-sm">
      <div className="mb-3 text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-[13px] font-semibold text-white">O</div>
        <div className="mt-1 text-[11px] text-gray-500">Olera{senderLast4 ? ` · ••${senderLast4}` : ""}</div>
      </div>
      <div className="mb-2 text-center text-[10px] text-gray-400">Text Message</div>
      <div className="flex justify-start">
        <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2.5 text-[14px] leading-snug text-gray-900">
          <BodyWithLinks body={body} />
        </div>
      </div>
    </div>
  );
}
