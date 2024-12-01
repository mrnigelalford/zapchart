import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';

interface CorsOptions {
  methods?: string[];
  origin?: string | string[];
  optionsSuccessStatus?: number;
}

export const cors = (options: CorsOptions) => {
  const corsMiddleware = Cors(options);

  return (req: NextApiRequest, res: NextApiResponse) =>
    new Promise<void>((resolve, reject) => {
      corsMiddleware(req, res, (result: Error | null) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve();
      });
    });
};
