import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, HeartHandshake, ShieldCheck } from "lucide-react";

import { siteConfig } from "@/lib/site";
import styles from "./support.module.css";

export const metadata: Metadata = {
  title: "حمایت از پروژه",
  description: "حمایت مالی از توسعه و نگهداری دیتابیس انتخاب رشته.",
};

export default function SupportPage() {
  const donofaUrl = siteConfig.projectDonationUrl;

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowRight size={18} aria-hidden="true" />
          بازگشت به دیتابیس
        </Link>
      </header>

      <section className={styles.shell} aria-labelledby="support-payment-title">
        <div className={styles.intro}>
          <span className={styles.iconWrap} aria-hidden="true">
            <HeartHandshake size={26} />
          </span>
          <p className={styles.eyebrow}>حمایت از ادامهٔ پروژه</p>
          <h1 id="support-payment-title">اگه دوست داشتی، یه حمایت کوچیک بفرست.</h1>
          <p>
            پرداخت از طریق صفحهٔ اختصاصی دونوفا انجام می‌شه. روش‌های فعال پرداخت
            همون‌جا نمایش داده می‌شن و اطلاعات بانکی داخل این سایت دریافت نمی‌شه.
          </p>
        </div>

        <div className={styles.notes}>
          <p>
            <ShieldCheck size={17} aria-hidden="true" />
            پرداخت روی بستر دونوفا انجام می‌شه و این سایت اطلاعات کارت بانکی رو دریافت یا ذخیره نمی‌کنه.
          </p>
          <p>
            مبلغ، نام و پیام حمایتت رو می‌تونی داخل صفحهٔ دونوفا وارد کنی.
          </p>
        </div>

        <div className={styles.actionArea}>
          {donofaUrl ? (
            <a
              className={styles.donofaButton}
              href={donofaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              رفتن به صفحهٔ حمایت
              <ExternalLink size={18} aria-hidden="true" />
            </a>
          ) : (
            <>
              <button className={styles.donofaButton} type="button" disabled>
                صفحهٔ حمایت در حال فعال‌سازی است
              </button>
              <p className={styles.pendingNote}>
                به‌محض ثبت صفحهٔ اختصاصی دونوفا، همین دکمه فعال می‌شه.
              </p>
            </>
          )}
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
