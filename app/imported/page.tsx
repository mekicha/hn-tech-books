import { ImportedCatalog } from '@/components/imported-catalog';
export const metadata={title:'Technical books from Hacker News'};
export default function Imported(props:{searchParams:Promise<{q?:string;page?:string;sort?:string}>}){return <ImportedCatalog {...props}/>;}
