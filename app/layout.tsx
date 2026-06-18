import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "我輩學堂｜張曼娟的古典文學學堂",
    template: "%s｜我輩學堂",
  },
  description: "跟隨張曼娟慢讀經典，從詩詞、古文與文學史中讀懂古人，也讀懂我們這一輩的生活。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="zh-Hant">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
