'use client';
export function ImportedSort({value}:{value:'mentions'|'title'}) {
 return <label className="imported-sort">Sort <select aria-label="Sort imported books" name="sort" defaultValue={value} onChange={event=>event.currentTarget.form?.requestSubmit()}><option value="mentions">Most mentions</option><option value="title">Title A–Z</option></select></label>;
}
