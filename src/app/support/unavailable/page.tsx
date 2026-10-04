import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";

import styles from "../support.module.css";

export default function SupportUnavailablePage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.intro}>
          <span className={styles.iconWrap} aria-hidden="true">
            <Wrench size={27} />
          </span>
          <p className={styles.eyebrow}>درگاه هنوز کامل وصل نشده</p>
          <h1>پرداخت فعلاً فعال نیست.</h1>
          <p>
            صفحهٔ حمایت آماده است، اما اتصال امن درگاه هنوز نیاز به فعال‌سازی
            کلید API روی سرور دارد. بعد از فعال شدن، همین دکمه‌ها مستقیم فاکتور
            پرداخت می‌سازند.
          </p>
        </div>
        <Link className={styles.backLink} href="/support/">
          <ArrowRight size={18} aria-hidden="true" />
          برگشت به انتخاب مبلغ
        </Link>
      </section>
    </main>
  );
}
