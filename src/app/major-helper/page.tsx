import type { Metadata } from "next";
import { MajorHelper } from "@/components/major-helper";

export const metadata: Metadata = {
  title: "دستیار کدرشته‌محل‌های ۱۴۰۵",
  description: "جستجوی کدرشته‌محل‌های گردآوری‌شده سال ۱۴۰۵، بررسی رشته و دانشگاه، ذخیره و مرتب‌سازی انتخاب‌ها.",
  alternates: { canonical: "/major-helper/" },
};

export default function MajorHelperPage() {
  return <MajorHelper />;
}
