import "./globals.css";

export const metadata = {
  title: "Atelier",
  description: "Minimal beauty commerce UI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
