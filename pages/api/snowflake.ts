 import { NextApiRequest, NextApiResponse } from 'next';

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // For now, return the Spider2 database list
    // We'll connect via SQL API later
    const mockSpider2Databases = [
      { name: 'ACADEMIC_MANAGEMENT', description: 'University academic system' },
      { name: 'AUTOMOTIVE_SALES', description: 'Car dealership operations' },
      { name: 'HEALTHCARE_ANALYTICS', description: 'Hospital patient management' },
      { name: 'RETAIL_OPERATIONS', description: 'E-commerce retail system' },
      { name: 'FINANCE_DATA', description: 'Banking transaction system' }
    ];

    if (req.method === 'GET' && req.query.action === 'databases') {
      res.status(200).json({
        success: true,
        databases: mockSpider2Databases.map(db => [null, db.name, db.description])
      });
    } else {
      res.status(200).json({ success: true, message: 'Snowflake API ready' });
    }
  }