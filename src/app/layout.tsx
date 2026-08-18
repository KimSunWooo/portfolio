import "./globals.css";

export const metadata = {
  title: "김선우 | Developer Portfolio",
  description: "김선우 개발자 포트폴리오",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
