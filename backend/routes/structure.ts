import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.cache'
]);

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
}

function buildTree(dirPath: string, relativePath: string = ''): FileTreeNode[] {
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_e) {
    return [];
  }

  // Sort directories first, then files alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const nodes: FileTreeNode[] = [];

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        children: buildTree(fullPath, relPath)
      });
    } else if (entry.isFile()) {
      let size = 0;
      try {
        size = fs.statSync(fullPath).size;
      } catch (_e) {}

      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        size
      });
    }
  }

  return nodes;
}

function generateAsciiTree(nodes: FileTreeNode[], prefix: string = ''): string {
  let result = '';

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    if (node.type === 'directory') {
      result += `${prefix}${connector}${node.name}/\n`;
      if (node.children && node.children.length > 0) {
        result += generateAsciiTree(node.children, prefix + childPrefix);
      }
    } else {
      result += `${prefix}${connector}${node.name}\n`;
    }
  });

  return result;
}

// GET /api/folder-structure - Return complete folder structure
router.get('/', (req: Request, res: Response) => {
  try {
    const rootDir = process.cwd();
    const tree = buildTree(rootDir);
    const folderName = path.basename(rootDir);
    const projectName = (folderName && folderName !== '/' && folderName !== '.') ? folderName : 'task';
    const asciiText = `${projectName}/\n` + generateAsciiTree(tree);

    res.json({
      success: true,
      projectName,
      timestamp: new Date().toISOString(),
      tree,
      asciiText
    });
  } catch (err: any) {
    console.error('[Folder Structure API Error]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to scan project folder structure',
      details: err.message
    });
  }
});

export default router;
