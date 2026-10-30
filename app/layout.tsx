import type { Metadata } from 'next';
import { ReadingListProvider } from '@/components/reading-list';
import { Header } from '@/components/header';
import './globals.css';
export const metadata: Metadata = { title: { default: 'The Hacker’s Bookshelf — Books with context', template: '%s · The Hacker’s Bookshelf' }, description: 'Technical books recommended on Hacker News, with the original comments and context behind every recommendation.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body><ReadingListProvider><Header/>{children}<footer className="site-footer"><span>Good books. Real conversations.</span><span>An independent project · Not affiliated with Hacker News</span></footer></ReadingListProvider></body></html>;
}
