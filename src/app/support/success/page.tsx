import Link from "next/link";
import { CircleCheck, ArrowRight } from "lucide-react";

import styles from "../support.module.css";

export default function SupportSuccessPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.intro}>
          <span className={styles.iconWrap} aria-hidden="true">
            <CircleCheck size={27} />
          </span>
          <p className={styles.eyebrow}>بازگشت از صفحهٔ پرداخت</p>
          <h1>مرسی که کنار پروژه‌ای.</h1>
          <p>
            درخواست پرداخت از سمت رمزفا برگشته. ثبت نهایی تراکنش بر اساس وضعیت
            تأییدشدهٔ ارائه‌دهنده انجام می‌شه.
          </p>
        </div>
        <Link className={styles.backLink} href="/">
          <ArrowRight size={18} aria-hidden="true" />
          برگشت به دیتابیس
        </Link>
      </section>
    </main>
  );
}
