import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';

export const cors = (options: any) => {
  const corsMiddleware = Cors(options);

  return (req: NextApiRequest, res: NextApiResponse) =>
    new Promise((resolve, reject) => {
      corsMiddleware(req, res, (result: any) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
};
