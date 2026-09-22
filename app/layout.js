import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import RoleProvider from "@/components/layout/RoleProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata = {
  title: "CampusRide — Smart Campus Shuttle",
  description:
    "Book campus shuttle rides, manage drivers and routes. A modern shuttle management system for university campuses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full font-[family-name:var(--font-jakarta)] antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <RoleProvider>{children}</RoleProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "glass-strong !rounded-xl",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
