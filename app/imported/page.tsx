import { ImportedCatalog } from '@/components/imported-catalog';
export const metadata={title:'Locally imported HN books'};
export default function Imported(props:{searchParams:Promise<{q?:string;page?:string}>}){return <ImportedCatalog {...props}/>;}
