import Link from "next/link";
import { ArrowUpLeft, BookmarkCheck, SearchCheck } from "lucide-react";
import styles from "./major-helper-promo.module.css";

export function MajorHelperPromo() {
  return (
    <section className={styles.wrap} aria-labelledby="major-helper-promo-title">
      <div className={styles.symbol} aria-hidden="true"><SearchCheck size={23} /></div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>ابزار تازهٔ انتخاب رشته</p>
        <h2 id="major-helper-promo-title">دستیار کدرشته‌محل‌های ۱۴۰۵</h2>
        <p>رشته و دانشگاهت رو پیدا کن، جزئیات کدرشته‌محل‌ها رو بخون و لیست انتخاب‌هات رو با ترتیب دلخواه ذخیره کن.</p>
        <span className={styles.hint}><BookmarkCheck size={16} /> ذخیره علاقه‌مندی‌ها و خروجی PDF / JSON</span>
      </div>
      <Link className={styles.action} href="/major-helper/">
        ورود به دستیار انتخاب رشته <ArrowUpLeft size={19} aria-hidden="true" />
      </Link>
    </section>
  );
}
