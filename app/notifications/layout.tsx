import { Providers } from "./providers";
import { Sora } from "next/font/google";

const SoraFont = Sora({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className={`${SoraFont.className} min-h-screen flex flex-col`}>
        {children}
      </div>
    </Providers>
  );
}
