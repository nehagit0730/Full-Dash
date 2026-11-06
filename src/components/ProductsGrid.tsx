import React from 'react';
import { Collection, Customer, Product } from '../types';
import ProductListing from './storefront/ProductListing';

interface ProductsGridProps {
  products: Product[];
  collections: Collection[];
  activeCollectionId: string;
  onActiveCollectionChange: (id: string) => void;
  loggedInCustomer: Customer | null;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenLoginModal?: () => void;
}

/** The Shop page: every product, with category, price and sale filters. */
export default function ProductsGrid({
  products,
  collections,
  activeCollectionId,
  onActiveCollectionChange,
  loggedInCustomer,
  onToggleWishlist,
  onAddToCart,
  onOpenLoginModal
}: ProductsGridProps) {
  return (
    <ProductListing
      products={products}
      collections={collections}
      activeCollectionId={activeCollectionId}
      onActiveCollectionChange={onActiveCollectionChange}
      customer={loggedInCustomer}
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      onNeedLogin={onOpenLoginModal}
      title="Shop all"
      description="Dresses, ethnic wear, tops and everyday essentials."
    />
  );
}
