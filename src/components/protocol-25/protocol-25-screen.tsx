"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import {
  INITIAL_FRAME, lockProtocol25Session, scheduleProtocol25,
  type Protocol25Frame,
} from "./sequence";
import styles from "./protocol-25.module.css";

const DIAGNOSTICS = ["VERIFYING ACCESS...", "CHECKING SESSION...", "CLEARANCE MISMATCH"];
const LOGS = ["Database access: DENIED", "Session privileges: REVOKED", "Connection route: CLOSED"];
const STREAMS = Array.from({ length: 12 }, (_, index) => ({
  left: `${4 + index * 8}%`, delay: `${index * -0.37}s`,
  duration: `${2.7 + (index % 4) * 0.45}s`,
}));

export function Protocol25Screen({
  terminated, onTerminate,
}: {
  terminated: boolean;
  onTerminate: () => void;
}) {
  const [frame, setFrame] = useState<Protocol25Frame>(
    terminated ? { ...INITIAL_FRAME, stage: "terminated" } : INITIAL_FRAME,
  );
  const screen = useRef<HTMLDivElement>(null);
  const stage = terminated ? "terminated" : frame.stage;

  useEffect(() => {
    const elements = [document.getElementById("main-content"), document.querySelector<HTMLAnchorElement>('body > a[href="#main-content"]')];
    const previous = elements.map((element) => element?.inert);
    elements.forEach((element) => { if (element) element.inert = true; });
    screen.current?.focus({ preventScroll: true });
    return () => elements.forEach((element, index) => {
      if (element) element.inert = previous[index] ?? false;
    });
  }, []);

  useEffect(() => {
    if (terminated) return;
    return scheduleProtocol25((nextFrame) => {
      if (nextFrame.stage === "terminated") {
        lockProtocol25Session();
        onTerminate();
      }
      setFrame(nextFrame);
    });
  }, [onTerminate, terminated]);

  const final = stage === "terminated";
  const alert = stage === "flagged" || stage === "lockdown";
  const ending = stage === "countdown" || stage === "eject";
  const title = final ? "CONNECTION CLOSED" : ending ? "SESSION TERMINATED" : alert ? "ACCESS FLAGGED" : "SECURITY SCAN";
  const message = final ? "ارتباط این نشست با دیتابیس برای همیشه بسته شد." : ending ? "این نشست اجازه ورود به دیتابیس را ندارد." : alert ? "سطح دسترسی مورد تأیید نیست." : "در حال بررسی نشست...";

  return createPortal(
    <div
      ref={screen}
      className={`protocol25-overlay ${styles.overlay}`}
      data-testid="protocol25-screen" data-stage={stage}
      tabIndex={-1} aria-label="پروتکل ۲۵" role="region"
    >
      {stage === "init" ? (
        <div className={styles.accepted}>
          <span className={styles.acceptedMark} aria-hidden="true">✓</span>
          <p>۲۵ درصد</p>
          <span>انتخاب ثبت شد</span>
        </div>
      ) : (
        <>
          {!final ? (
            <>
              <div className={styles.grid} aria-hidden="true" />
              <div className={`protocol25-streams ${styles.streams}`} aria-hidden="true">
                {STREAMS.map((stream, index) => (
                  <span key={index} className={`protocol25-stream ${styles.stream}`} style={{
                    left: stream.left, "--stream-delay": stream.delay,
                    "--stream-duration": stream.duration, "--corruption-delay": `${index * 100}ms`,
                  } as CSSProperties}>01<br />25<br />10<br />00<br />01</span>
                ))}
              </div>
              <div className={styles.scanLine} aria-hidden="true" />
              <div className={styles.telemetry} dir="ltr" aria-hidden="true">
                <span>PROTOCOL / 25</span><span>SESSION AUDIT</span>
              </div>
              <div className={styles.bottomTelemetry} dir="ltr" aria-hidden="true">
                <span>ISOLATED CHANNEL</span><span>{ending ? "ROUTE / CLOSED" : "CLEARANCE / PENDING"}</span>
              </div>
            </>
          ) : null}

          <div className={final ? styles.final : `protocol25-card ${styles.card}`}>
            <span className={styles.statusDot} aria-hidden="true" />
            <div role="status" aria-live="polite" aria-atomic="true">
              <h2 className={styles.title} dir="ltr" lang="en">{title}</h2>
              {alert ? <p className={styles.protocolLabel} dir="ltr" lang="en">PROTOCOL 25</p> : null}
              <p className={styles.message} dir="rtl">{message}</p>
            </div>

            {stage === "scan" || stage === "pause" || stage === "anomaly" ? (
              <div className={styles.scan} dir="ltr" lang="en">
                <div className={styles.scanMeta}><span>SECURITY SCAN</span><span data-testid="protocol25-progress">{frame.progress}%</span></div>
                <div className={styles.track} aria-hidden="true"><span style={{ width: `${frame.progress}%` }} /></div>
                <div className={styles.diagnostics} aria-hidden="true">
                  {DIAGNOSTICS.slice(0, frame.diagnostics).map((line) => <p key={line}><span>›</span><span>{line}</span></p>)}
                </div>
              </div>
            ) : null}

            {alert ? (
              <>
                <p className={styles.secondary} dir="rtl">درخواست ورود به دیتابیس متوقف شد.</p>
                <div className={styles.logs} dir="ltr" lang="en" aria-hidden="true">
                  {LOGS.slice(0, frame.logs).map((line) => <p key={line}><span>×</span><span>{line}</span></p>)}
                </div>
                <p className={styles.microcopy} dir="rtl">سامانه در حال بستن مسیر دسترسی است...</p>
              </>
            ) : null}

            {ending ? <div className={styles.countdown} data-testid="protocol25-countdown" dir="ltr" aria-hidden="true">{frame.countdown}</div> : null}
            {final ? (<>\n              <p className={styles.finalThanks} dir="rtl">از همراهی شما سپاسگزاریم. روز خوش!</p>\n              <p className={styles.finalLabel} dir="ltr" lang="en">PROTOCOL 25 / SESSION LOCKED</p>\n            </>) : null}
          </div>
        </>
      )}
    </div>, document.body,
  );
}
