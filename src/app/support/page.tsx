import type { Metadata } from "next";
import { ArrowRight, HeartHandshake, ShieldCheck } from "lucide-react";

import styles from "./support.module.css";

export const metadata: Metadata = {
  title: "حمایت از پروژه",
  description: "حمایت مالی از توسعه و نگهداری دیتابیس انتخاب رشته.",
};

const amounts = [1, 2, 3, 4, 5, 10, 15, 20, 30, 50] as const;

const faDigits = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

export default function SupportPage() {
  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.backLink}>
          <ArrowRight size={18} aria-hidden="true" />
          بازگشت به دیتابیس
        </a>
      </header>

      <section className={styles.shell} aria-labelledby="support-payment-title">
        <div className={styles.intro}>
          <span className={styles.iconWrap} aria-hidden="true">
            <HeartHandshake size={26} />
          </span>
          <p className={styles.eyebrow}>حمایت از ادامهٔ پروژه</p>
          <h1 id="support-payment-title">مبلغ حمایتت رو انتخاب کن.</h1>
          <p>
            مبلغ دلاری موردنظرت رو بزن. یک فاکتور امن ساخته می‌شه و ادامهٔ
            پرداخت در صفحهٔ رمزفا انجام می‌شه.
          </p>
        </div>

        <div className={styles.amountGrid} aria-label="مبلغ حمایت">
          {amounts.map((amount) => (
            <form method="post" action="/api/donate/create" key={amount}>
              <button
                type="submit"
                name="amount"
                value={amount}
                className={amount === 10 ? styles.recommendedAmount : styles.amount}
              >
                <span>{faDigits.format(amount)}</span>
                <small>دلار</small>
                {amount === 10 ? <em>پیشنهادی</em> : null}
              </button>
            </form>
          ))}
        </div>

        <div className={styles.notes}>
          <p>
            <ShieldCheck size={17} aria-hidden="true" />
            کلید API فقط روی سرور Cloudflare نگهداری می‌شه و وارد مرورگر تو نمی‌شه.
          </p>
          <p>
            روش‌های پرداختی که در مرحلهٔ بعد نمایش داده می‌شن، توسط رمزفا و بر اساس
            امکانات فعال حساب تعیین می‌شن.
          </p>
        </div>

        <aside className={styles.pledge}>
          <strong>مازاد کمک‌ها، کامل به محک می‌رسه.</strong>
          <span>
            هزینه‌های پروژه و رسید واریز مازاد در گزارش‌های مالی منتشر می‌شن.
          </span>
        </aside>
      </section>
    </main>
  );
}
