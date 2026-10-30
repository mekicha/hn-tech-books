import { Suspense } from 'react';
import { Catalog } from '@/components/catalog';
import { ImportedCatalog } from '@/components/imported-catalog';
export default async function Home({searchParams}:{searchParams:Promise<{q?:string;page?:string;sort?:string;saved?:string;reviewed?:string}>}) {
 const params=await searchParams;
 if(params.saved==='1'||params.reviewed==='1')return <Suspense fallback={<main className="page"><p>Opening the bookshelf…</p></main>}><Catalog/></Suspense>;
 return <ImportedCatalog searchParams={Promise.resolve(params)} basePath="/"/>;
}
