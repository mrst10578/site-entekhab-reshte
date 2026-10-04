import { ArrowUpLeft } from "lucide-react";

import { siteConfig } from "@/lib/site";
import styles from "./community.module.css";

const CHANNELS = [
  { handle: "LoPRax_KonKour", name: "LoPRax", theme: "loprax" },
  { handle: "Flow_KonKour", name: "Flow", theme: "flow" },
  { handle: "SparX_KonKour", name: "SparX", theme: "sparx" },
] as const;

const CONTRIBUTORS = [
  { name: "محدثه اسماعیلی", title: "خانم" },
  { name: "نیما خوشرفتار", title: "آقای" },
  { name: "آرشام رحمانی", title: "آقای" },
  { name: "حسین وزیری", title: "آقای" },
  { name: "مهدی علیزاده", title: "آقای" },
];

export function SiteFooter() {
  return (
    <footer className={'site-footer ' + styles.footer}>
      <div className={styles.footerHeading}>
        <div>
          <p className={styles.eyebrow}>در ارتباط بمانیم</p>
          <h2>ادامهٔ این مسیر، در تلگرام.</h2>
        </div>
        <span className={styles.footerNote}>کانال‌های ما</span>
      </div>
      <nav className={styles.channels} aria-label="کانال‌های تلگرام">
        {CHANNELS.map((channel) => (
          <a
            key={channel.handle}
            className={styles.channel + ' ' + styles[channel.theme]}
            href={'https://t.me/' + channel.handle}
            target="_blank" rel="noopener noreferrer" dir="ltr"
            aria-label={'@' + channel.handle}
          >
            <div>
              <span className={styles.channelBrand} lang="en">{channel.name}</span>
              <span className={styles.channelHandle}>@{channel.handle}</span>
            </div>
            <ArrowUpLeft size={20} aria-hidden="true" />
          </a>
        ))}
      </nav>
      <div className={styles.credits}>
        <div className={styles.creditsHeading}>
          <h3>با تشکر ویژه از همراهان پروژه</h3>
          <p>جهت همکاری و کمک در جمع‌آوری اطلاعات</p>
        </div>
        <ul className={styles.creditList} aria-label="همراهان پروژه">
          {CONTRIBUTORS.map((person) => (
            <li key={person.name}><span className={styles.honorific}>{person.title}</span><span>{person.name}</span></li>
          ))}
        </ul>
      </div>
      <div className={styles.footerBottom}>
        <div><strong>{siteConfig.name}</strong><p>داده ساختگی در نتایج نمایش داده نمی‌شود.</p></div>
        <span className={styles.signature} dir="ltr" title="امضای سازنده: ZH.">ZH<span>.</span></span>
      </div>
    </footer>
  );
}
