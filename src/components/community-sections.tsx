import {
  ArrowDown, ArrowUpLeft, ChevronDown, FileText, HeartHandshake,
  ReceiptText, ShieldCheck, Sprout, Upload,
} from "lucide-react";

import { siteConfig } from "@/lib/site";
import styles from "./community.module.css";

export function MahakBanner() {
  return (
    <section id="mahak-banner" className={styles.banner} aria-labelledby="mahak-title">
      <div className={styles.bannerCopy}>
        <p className={styles.warmEyebrow}>
          <HeartHandshake size={19} aria-hidden="true" />
          یک سهم برای محک
        </p>
        <h2 id="mahak-title">اگه اینجا به کارت اومد،<br />سهمی هم برای محک کنار بذار.</h2>
        <p className={styles.bannerLead}>
          اگر این دیتابیس حتی کمی کمک کرد هزینهٔ چندمیلیونی مشاوره را نپردازی،
          می‌تونی بخشی از مبلغی که صرفه‌جویی شده را برای حمایت از کودکان مبتلا به
          سرطان به محک هدیه کنی.
        </p>
      </div>
      <div className={styles.bannerActions}>
        <a className={styles.mahakButton} href={siteConfig.mahakDonationUrl} target="_blank" rel="noopener noreferrer">
          کمک مستقیم به محک <ArrowUpLeft size={18} aria-hidden="true" />
        </a>
        <a className={styles.secondaryButton} href="#support">
          کمک به توسعهٔ پروژه <ArrowDown size={17} aria-hidden="true" />
        </a>
        <p>پرداخت مستقیم در سایت رسمی محک انجام می‌شود.</p>
      </div>
    </section>
  );
}


export function SelectionEntryLinks() {
  return (
    <section className={styles.flowPortal} aria-label="ورودی ابزارهای انتخاب رشته">
      <div className={styles.flowPortalBrand}>
        <img
          className={styles.flowPortalLogo}
          src="/assets/flow/flow-logo.jpg"
          alt="Flow"
          width="154"
          height="64"
          loading="eager"
          decoding="async"
        />
      </div>

      <a
        className={styles.flowPortalButton}
        data-flow-asset="toolbox"
        href="https://entekhab-reshte.flow1.workers.dev/"
      >
        <span>ورود به جعبه ابزار انتخاب رشته</span>
        <ArrowUpLeft size={18} aria-hidden="true" />
      </a>

      <div className={styles.flowSeparatorAsset} data-flow-asset="separator-1" aria-hidden="true" />

      <a
        className={styles.flowPortalButton}
        data-flow-asset="latest-admissions"
        href="https://entekhab-reshte.flow1.workers.dev/last-admissions/"
      >
        <span>ورود به آخرین قبولی رشته ها</span>
        <ArrowUpLeft size={18} aria-hidden="true" />
      </a>

      <div className={styles.flowSeparatorAsset} data-flow-asset="separator-2" aria-hidden="true" />

      <a
        className={styles.flowPortalButton}
        data-flow-asset="admission-capacity"
        href="https://entekhab-reshte.flow1.workers.dev/capacity/"
      >
        <span className={styles.flowPortalButtonCopy}>
          <span>ورود به دیتای ظرفیت پذیرش رشته ها در سال های مختلف</span>
          <span className={styles.flowUpdateBadge}>در حال به روز رسانی</span>
        </span>
        <ArrowUpLeft size={18} aria-hidden="true" />
      </a>
    </section>
  );
}

export function ProjectSupport() {
  return (
    <section id="support" className={styles.support} aria-labelledby="support-title">
      <div className={styles.supportIntro}>
        <p className={styles.eyebrow}><Sprout size={17} aria-hidden="true" /> همراهِ ادامهٔ مسیر</p>
        <h2 id="support-title">این تازه شروع راهه.</h2>
        <p>
          این دیتابیس، فاز اول پروژه است. مسیر گسترش داده‌ها و بهتر کردن دسترسی
          به اطلاعات ادامه دارد. اگر دوست داری در ساختن فازهای بعدی شریک باشی،
          می‌تونی به هزینه‌های توسعه و نگهداری پروژه کمک کنی.
        </p>
      </div>

      <div className={styles.supportBody}>
        <div className={styles.pledge}>
          <span className={styles.pledgeNumber}>۱۰۰٪</span>
          <div>
            <h3>مازاد کمک‌ها، کامل به محک می‌رسد.</h3>
            <p>
              تمام مبلغی که بیشتر از نیاز پروژه جمع شود، به حساب محک واریز
              می‌شود. <strong>هیچ بخشی از کمک‌های شما صرف درآمد یا دستمزد شخصی نخواهد شد.</strong>
            </p>
          </div>
        </div>

        <div className={'support-card ' + styles.fundingCard}>
          <div className={styles.transparencyHeading}>
            <ReceiptText size={21} aria-hidden="true" />
            <h3>هر کمک، با هزینه‌های روشن.</h3>
          </div>
          <p className={styles.fundingCopy}>
            در پایان هر ماه، هزینه‌هایی که از کمک‌های شما پرداخت شده‌اند،
            همراه با تصویر فاکتورها در مستندات مالی همین بخش منتشر می‌شوند.
            رسید واریز مبالغ مازاد به محک هم در همان گزارش قرار می‌گیرد.
          </p>
          <div className={styles.fundingActions}>
            <a
              className={styles.projectButton}
              href={siteConfig.projectDonationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              حمایت مالی از پروژه <ArrowUpLeft size={17} aria-hidden="true" />
            </a>
            <span className={styles.documentsHint}><FileText size={16} aria-hidden="true" /> گزارش‌ها و تصویر فاکتورها</span>
          </div>
          <p className={styles.paymentNote}>با زدن دکمه، صفحهٔ حمایت دونوفا مستقیم باز می‌شود.</p>
          <details className={styles.documents} data-testid="financial-documents">
            <summary>مستندات مالی <ChevronDown size={17} aria-hidden="true" /></summary>
            <div className={styles.documentsContent}>
              <span className={styles.emptyIcon}><ReceiptText size={22} aria-hidden="true" /></span>
              <h4>هنوز گزارشی منتشر نشده</h4>
              <p>
                گزارش‌های ماهانه، تصویر فاکتور هزینه‌ها و رسید واریز مازاد
                کمک‌ها به محک، پس از تهیه در همین بخش قرار می‌گیرند.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

export function DataContribution() {
  return (
    <section id="contribute" className={'content-section ' + styles.contribution} aria-labelledby="contribute-title">
      <div className={styles.contributionCopy}>
        <p className={styles.eyebrow}><Upload size={17} aria-hidden="true" /> همراهی، با یک کارنامهٔ واقعی</p>
        <h2 id="contribute-title">به تکمیل دیتابیس کمک کن.</h2>
        <p>
          با ارسال کارنامه، کمک می‌کنی اطلاعات قبولی برای همه در دسترس باشد و
          کمتر کسی از کمبود اطلاعات سوءاستفاده کند. برای ثبت و مستندسازی رتبه
          و محل قبولی، فقط این دو کارنامه را نیاز داریم:
        </p>
        <ul className={styles.requiredDocuments} aria-label="کارنامه‌های مورد نیاز">
          <li><FileText size={17} aria-hidden="true" /> کارنامهٔ رتبه</li>
          <li><FileText size={17} aria-hidden="true" /> کارنامه نهایی، برای مستندسازی محل قبولی</li>
        </ul>
        <p className={styles.privacyNote}>
          <ShieldCheck size={18} aria-hidden="true" />
          <span><strong>اطلاعات شخصی نیاز نداریم.</strong> قبل از ارسال، نام، کد ملی، عکس و شماره پرونده را از تصاویر حذف کن.</span>
        </p>
      </div>
      <div className={styles.contributionAction}>
        <span className={styles.soonBadge}>به‌زودی</span>
        <button type="button" className={styles.contributeButton} disabled aria-describedby="contribution-timing">
          ارسال کارنامه <Upload size={17} aria-hidden="true" />
        </button>
        <p id="contribution-timing">به‌زودی، بعد از اعلام نتایج نهایی کنکور</p>
      </div>
    </section>
  );
}
