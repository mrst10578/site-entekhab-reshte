import Link from "next/link";
import { CircleX, ArrowRight } from "lucide-react";

import styles from "../support.module.css";

export default function SupportCancelPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.intro}>
          <span className={styles.iconWrap} aria-hidden="true">
            <CircleX size={27} />
          </span>
          <p className={styles.eyebrow}>پرداخت انجام نشد</p>
          <h1>پرداخت لغو شد.</h1>
          <p>
            مبلغی از سمت این صفحه ثبت نشده. می‌تونی دوباره مبلغ رو انتخاب کنی یا
            برگردی به دیتابیس.
          </p>
        </div>
        <Link className={styles.backLink} href="/support/">
          <ArrowRight size={18} aria-hidden="true" />
          انتخاب دوبارهٔ مبلغ
        </Link>
      </section>
    </main>
  );
}
