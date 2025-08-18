 import { NextApiRequest, NextApiResponse } from 'next';
  import snowflake from 'snowflake-sdk';

  const createConnection = () => {
    return snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USER!,
      password: process.env.SNOWFLAKE_PASSWORD!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
    });
  };

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const connection = createConnection();

    if (req.method === 'GET' && req.query.action === 'databases') {
      try {
        await new Promise((resolve, reject) => {
          connection.connect((err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });

        const databases = await new Promise((resolve, reject) => {
          connection.execute({
            sqlText: 'SHOW DATABASES',
            complete: (err, stmt, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          });
        });

        res.status(200).json({ success: true, databases });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      } finally {
        connection.destroy();
      }
    }

    else if (req.method === 'POST' && req.query.action === 'schema') {
      const { database } = req.body;

      try {
        await new Promise((resolve, reject) => {
          connection.connect((err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });

        const schema = await new Promise((resolve, reject) => {
          connection.execute({
            sqlText: `USE DATABASE ${database}; SHOW TABLES;`,
            complete: (err, stmt, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          });
        });

        res.status(200).json({ success: true, schema });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      } finally {
        connection.destroy();
      }
    }

    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  }