import { Suspense } from 'react';
import { ProductsPage } from '../all-products/page';

const normalizeSearchParams = (params = {}) => {
  if (!params || typeof params !== 'object') return {};
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
};

export default async function PrintersPage({ searchParams = {} }) {
  const resolvedParams = await searchParams;
  const normalized = normalizeSearchParams(resolvedParams);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProductsPage
        searchParams={normalized}
        restrictToType="printer"
        pageTitle="Printers"
        showCategoryFilter={false}
      />
    </Suspense>
  );
}

