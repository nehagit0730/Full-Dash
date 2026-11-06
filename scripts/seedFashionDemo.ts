/**
 * Loads a demo women's clothing catalogue (products, sizes, collections) with
 * free Unsplash photos, so the storefront has something to show.
 *
 *   npx tsx scripts/seedFashionDemo.ts                 # add/update the demo catalogue
 *   npx tsx scripts/seedFashionDemo.ts --archive-old   # also move every NON-demo product and
 *                                                      # collection to the Recycle Bin (restorable 30 days)
 *   npx tsx scripts/seedFashionDemo.ts --remove        # delete the demo products and collections again
 *
 * Writes to Neon when DATABASE_URL is set and reachable; otherwise to the local
 * fallback file (local_store_data.json). Safe to re-run: demo items have fixed
 * ids ("demo-…") and are updated in place. Existing items are never deleted —
 * --archive-old moves them to the Recycle Bin, where an admin can restore them.
 *
 * Photos: Unsplash License (free for commercial use, no attribution required).
 * Replace them with your own product photography before going live.
 */
import "dotenv/config";
import { deleteSingleItem, fetchResource, getDb, saveSingleItem } from "../serverDb";
import { moveToRecycleBin } from "../backend/services/recycleBin";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1000&h=1333&q=80&auto=format&fit=crop`;
const SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40"];

type Seed = {
  slug: string;
  title: string;
  price: number;
  compareAt?: number;
  photos: string[];
  category: string;
  sizes?: string[];
  tags?: string[];
  description: string;
};

const PRODUCTS: Seed[] = [
  // Dresses
  { slug: "scarlet-wrap-midi-dress", title: "Scarlet Wrap Midi Dress", price: 2499, compareAt: 3299, photos: ["1572804013309-59a88b7e92f1", "1612336307429-8a898d10e223"], category: "Dresses", tags: ["bestseller"], description: "A fluid wrap silhouette in a vivid red print, with a self-tie waist and flutter sleeves. Lightweight viscose that moves beautifully." },
  { slug: "plum-off-shoulder-gown", title: "Plum Off-Shoulder Gown", price: 3499, photos: ["1566174053879-31528523f8ae"], category: "Dresses", description: "An elegant off-shoulder gown in deep plum crepe with a softly draped bodice. Made for evenings to remember." },
  { slug: "burgundy-button-midi", title: "Burgundy Button-Front Midi", price: 2199, photos: ["1585487000160-6ebcfceb0d03"], category: "Dresses", tags: ["bestseller"], description: "A buttoned corduroy-texture midi with a gently flared skirt and three-quarter sleeves. Effortless from desk to dinner." },
  { slug: "red-flowing-maxi-gown", title: "Red Flowing Maxi Gown", price: 3999, compareAt: 4999, photos: ["1595777457583-95e059d581b8"], category: "Dresses", description: "A sweeping halter-neck maxi in rich red georgette, cut for movement and made for celebrations." },
  { slug: "blossom-floral-wrap-dress", title: "Blossom Floral Wrap Dress", price: 1899, photos: ["1496747611176-843222e1e57c"], category: "Dresses", description: "Soft florals on an ivory ground, in an easy wrap shape that flatters every frame. Perfect for summer days." },
  { slug: "midnight-lace-cutout-dress", title: "Midnight Lace Cut-out Dress", price: 2799, photos: ["1551803091-e20673f15770"], category: "Dresses", description: "Navy lace with subtle waist cut-outs and long sleeves — a modern take on a timeless fabric." },
  { slug: "blush-ruffle-sleeve-dress", title: "Blush Ruffle-Sleeve Dress", price: 2599, photos: ["1581044777550-4cfa60707c03"], category: "Dresses", tags: ["new"], description: "Romantic ruffled sleeves and a soft blush palette, finished with delicate smocking at the bodice." },

  // Ethnic wear
  { slug: "navy-gold-silk-saree", title: "Navy & Gold Silk Saree", price: 5499, compareAt: 6499, photos: ["1610030469983-98e550d6193c"], category: "Ethnic Wear", sizes: ["Free Size"], tags: ["bestseller"], description: "A rich navy silk saree with a woven gold border and pallu. Comes with an unstitched blouse piece." },
  { slug: "ivory-anarkali-set", title: "Ivory Anarkali Set", price: 4299, photos: ["1583391733956-3750e0ff4e8b"], category: "Ethnic Wear", tags: ["new"], description: "A flowing ivory anarkali with tonal embroidery, paired with a sheer dupatta. Graceful for every occasion." },
  { slug: "rose-pink-festive-saree", title: "Rose Pink Festive Saree", price: 6299, photos: ["1617627143750-d86bc21e42bb"], category: "Ethnic Wear", sizes: ["Free Size"], description: "A rose-pink saree with a contrast zari border, made for weddings and festive gatherings. Includes blouse piece." },

  // Tops
  { slug: "ivory-knit-poncho-top", title: "Ivory Knit Poncho Top", price: 1299, photos: ["1434389677669-e08b4cac3105"], category: "Tops", description: "A relaxed crochet-knit poncho top with a fringed hem. Layer it over slips, tanks or swimwear." },
  { slug: "teal-crochet-bralette-top", title: "Teal Crochet Crop Top", price: 899, photos: ["1469334031218-e382a71b716b"], category: "Tops", tags: ["new"], description: "A hand-finished crochet crop top in a deep teal. Pair with high-waist trousers or a midi skirt." },

  // Bottoms
  { slug: "blush-tapered-trousers", title: "Blush Tapered Trousers", price: 1499, photos: ["1594633312681-425c7b97ccd1"], category: "Bottoms", description: "Soft-tailored tapered trousers in blush pink with elasticated cuffs and a comfortable mid-rise waist." },
  { slug: "striped-wide-leg-pants", title: "Striped Wide-Leg Pants", price: 1699, photos: ["1509631179647-0177331693ae"], category: "Bottoms", description: "Bold monochrome stripes on a flowing wide leg. High-waisted, with a side zip and deep pockets." },

  // Outerwear & co-ords
  { slug: "sky-blue-wool-coat", title: "Sky Blue Wool-Blend Coat", price: 4499, compareAt: 5499, photos: ["1539109136881-3be0616acf4b"], category: "Outerwear", description: "A tailored wool-blend coat in a soft sky blue, with notched lapels and a belted waist." },
  { slug: "forest-check-overcoat", title: "Forest Check Overcoat", price: 3999, photos: ["1485968579580-b6d095142e6e"], category: "Outerwear", description: "A relaxed overcoat in a deep green check. Throw it over everything this season." },
  { slug: "rust-satin-bomber", title: "Rust Satin Bomber Jacket", price: 2999, photos: ["1591047139829-d91aecb6caea"], category: "Outerwear", tags: ["new"], description: "A lustrous rust satin bomber with ribbed trims. The finishing layer for jeans or dresses." },
  { slug: "sunshine-lounge-co-ord", title: "Sunshine Lounge Co-ord Set", price: 2299, photos: ["1515886657613-9f3515b0c78f"], category: "Outerwear", description: "A cosy cropped hoodie and jogger set in sunshine yellow. Soft brushed fleece inside." },

  // Accessories
  { slug: "cherry-structured-handbag", title: "Cherry Structured Handbag", price: 2499, photos: ["1584917865442-de89df76afd3"], category: "Accessories", sizes: [], description: "A structured top-handle bag in glossy cherry red, with a detachable strap and gold-tone hardware." },
  { slug: "floral-print-stiletto-heels", title: "Floral Print Stiletto Heels", price: 1999, photos: ["1543163521-1bf539c55dd2"], category: "Accessories", sizes: SHOE_SIZES, description: "Statement pointed heels in a bold floral print. Cushioned insole for comfort through the evening." }
];

const COLLECTIONS: { id: string; title: string; image: string; description: string }[] = [
  { id: "demo-col-dresses", title: "Dresses", image: "1572804013309-59a88b7e92f1", description: "From everyday midis to evening gowns." },
  { id: "demo-col-ethnic-wear", title: "Ethnic Wear", image: "1610030469983-98e550d6193c", description: "Sarees and anarkalis for every celebration." },
  { id: "demo-col-tops", title: "Tops", image: "1434389677669-e08b4cac3105", description: "Knits, crops and easy layers." },
  { id: "demo-col-bottoms", title: "Bottoms", image: "1594633312681-425c7b97ccd1", description: "Trousers and wide-leg pants." },
  { id: "demo-col-outerwear", title: "Outerwear", image: "1539109136881-3be0616acf4b", description: "Coats, jackets and co-ord sets." },
  { id: "demo-col-accessories", title: "Accessories", image: "1584917865442-de89df76afd3", description: "Bags and shoes to finish the look." }
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function buildProduct(s: Seed, index: number) {
  const id = `demo-${s.slug}`;
  const sizes = s.sizes === undefined ? SIZES : s.sizes;
  const createdAt = new Date(Date.now() - index * 3600_000).toISOString();
  return {
    id,
    title: s.title,
    slug: s.slug,
    description: `<p>${s.description}</p>`,
    price: s.price,
    compareAtPrice: s.compareAt || 0,
    inventory: 50,
    sku: id.toUpperCase(),
    category: s.category,
    vendor: "",
    status: "Active",
    image: img(s.photos[0]),
    media: s.photos.slice(1).map(img),
    weight: 0.4,
    weightUnit: "kg",
    tags: ["demo", ...(s.tags || [])],
    concreteVariants: sizes.map(size => ({
      id: `${id}-${slugify(size)}`,
      name: size,
      price: s.price,
      inventory: 10,
      description: "",
      images: []
    })),
    seoTitle: s.title,
    seoDescription: s.description.slice(0, 155),
    createdAt,
    updatedAt: createdAt
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const connected = await getDb();
  console.log(connected ? "Writing to the database (DATABASE_URL)." : "Database not reachable — writing to the local fallback file (local_store_data.json).");

  const products = PRODUCTS.map(buildProduct);

  if (args.has("--remove")) {
    for (const p of products) await deleteSingleItem("products", p.id);
    for (const c of COLLECTIONS) await deleteSingleItem("collections", c.id);
    console.log(`Removed ${products.length} demo products and ${COLLECTIONS.length} demo collections.`);
    return;
  }

  for (const p of products) await saveSingleItem("products", p);
  for (const c of COLLECTIONS) {
    const members = products.filter(p => p.category === c.title).map(p => p.id);
    await saveSingleItem("collections", {
      id: c.id,
      title: c.title,
      slug: slugify(c.title),
      description: c.description,
      type: "Manual",
      image: img(c.image),
      productIds: members,
      seoTitle: c.title,
      seoDescription: c.description
    });
  }
  console.log(`Saved ${products.length} demo products and ${COLLECTIONS.length} collections.`);

  if (args.has("--archive-old")) {
    let moved = 0;
    for (const resource of ["products", "collections"] as const) {
      const all: any[] = (await fetchResource(resource)) || [];
      for (const item of all) {
        if (!item?.id || String(item.id).startsWith("demo-")) continue;
        const r = await moveToRecycleBin(resource, String(item.id), "seedFashionDemo");
        if (r.ok) moved++;
        else console.warn(`  could not move ${resource}/${item.id}: ${r.message}`);
      }
    }
    console.log(`Moved ${moved} existing product(s)/collection(s) to the Recycle Bin (restorable for 30 days).`);
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect().catch(() => {});
  });
