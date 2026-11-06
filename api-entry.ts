import { createExpressApp } from "./serverApp";

const appPromise = createExpressApp();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
