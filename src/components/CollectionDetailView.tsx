import React, { useMemo } from 'react';
import { Collection, Customer, Product } from '../types';
import ProductListing from './storefront/ProductListing';

interface CollectionDetailViewProps {
  collection: Collection;
  allProducts: Product[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

/** A single collection's page: its products, with price and sale filters. */
export default function CollectionDetailView({ collection, allProducts, loggedInCustomer, onAddToCart, onToggleWishlist }: CollectionDetailViewProps) {
  const products = useMemo(() => {
    const ids = new Set(collection.productIds || []);
    return (allProducts || []).filter(p => ids.has(p.id));
  }, [collection, allProducts]);

  return (
    <ProductListing
      products={products}
      customer={loggedInCustomer}
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      title={collection.title}
      description={collection.description}
      showCategoryFilter={false}
    />
  );
}
