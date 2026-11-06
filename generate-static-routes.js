import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');

// Common slugify function mirroring front-end slugify
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const main = () => {
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('CRITICAL: dist/index.html not found! Run npm run build first.');
    process.exit(1);
  }

  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Let's construct a rich list of directories to create
  const routes = [];

  // 1. Pages slug folders (default and common custom ones)
  const commonPages = [
    'about',
    'about-us',
    'contact',
    'contact-us',
    'faq',
    'frequently-asked-questions',
    'subscribe',
    'brands',
    'account',
    'help',
    'shipping',
    'returns',
    'terms',
    'privacy',
    'privacy-policy',
    'terms-of-service',
    'support',
    'our-story',
    'story',
    'wholesale',
    'jobs',
    'careers',
    'feedback'
  ];

  commonPages.forEach(p => {
    routes.push(`pages/${p}`);
    // Also support root-level page /pages/about /pages/faq
  });

  // 2. Default initial products (both IDs and title-slugified variations so everything matches perfectly)
  const products = [
    { id: '77-black-tea', title: '77 Black Tea 10.4 mg' },
    { id: '77-cola-cherry', title: '77 Cola & Cherry 10.4 mg' },
    { id: '77-watermelon', title: '77 Watermelon 5.2 mg' },
    { id: '77-raspberry', title: '77 Raspberry 5.2 mg' },
    { id: '77-melon-mint', title: '77 Melon Mint 5.2 mg' },
    { id: '77-ice-mint', title: '77 Ice Mint 20 mg' },
    { id: '77-forest-fruits', title: '77 Forest Fruits 5.2 mg' },
    { id: '77-ghost-onion', title: '77 Ghost Onion 20 mg' },
    { id: 'cuba-watermelon', title: 'CUBA Watermelon 43 mg' },
    { id: 'cuba-tropical', title: 'CUBA Tropical Fruit 43 mg' },
    { id: 'cuba-yoghurt', title: 'CUBA Yoghurt 43 mg' },
    { id: 'cuba-double-fresh', title: 'CUBA Double Fresh 43 mg' },
    { id: 'cuba-cherry', title: 'CUBA Cherry 43 mg' },
    { id: 'cuba-banana-hit', title: 'CUBA Banana Hit 43 mg' },
    { id: 'clew-watermelon', title: 'CLEW Watermelon 5 mg' },
    { id: 'clew-spearmint', title: 'CLEW Spearmint 5 mg' },
    { id: 'clew-cool-mint', title: 'CLEW Cool Mint 20 mg' },
    { id: 'clew-coffee', title: 'CLEW Coffee 5 mg' },
    { id: 'killa-cold-mint', title: 'KILLA Cold Mint 16 mg' },
    { id: 'killa-blueberry', title: 'KILLA Blueberry 16 mg' },
    { id: 'velo-freeze', title: 'VELO Freeze Max 17 mg' }
  ];

  products.forEach(prod => {
    routes.push(`products/${prod.id}`);
    routes.push(`products/${slugify(prod.title)}`);
  });

  // 3. Default collections (both IDs and title-slugified variations)
  const collections = [
    { id: 'all', title: 'Shop All Pouches' },
    { id: '77', title: '77 Collection' },
    { id: 'cuba', title: 'CUBA Collection' },
    { id: 'clew', title: 'CLEW Collection' },
    { id: 'killa', title: 'KILLA & VELO Collection' },
    { id: 'bestseller', title: 'Bestseller' },
    { id: 'best-seller', title: 'Best Seller' },
    { id: 'new-arrivals', title: 'New Arrivals' }
  ];

  collections.forEach(col => {
    routes.push(`collections/${col.id}`);
    routes.push(`collections/${slugify(col.title)}`);
  });

  console.log(`[Static Routing Engine] Generating ${routes.length} physical routes underneath ${distPath}`);

  routes.forEach(route => {
    const routeDir = path.join(distPath, route);
    fs.mkdirSync(routeDir, { recursive: true });
    
    // Copy the index.html content to routeDir/index.html
    const targetHtmlPath = path.join(routeDir, 'index.html');
    fs.writeFileSync(targetHtmlPath, indexContent, 'utf8');
  });

  console.log('[Static Routing Engine] Completed physical routing successfully!');
};

main();
