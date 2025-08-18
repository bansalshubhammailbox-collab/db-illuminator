 import { NextApiRequest, NextApiResponse } from 'next';
  import { GoogleGenerativeAI } from '@google/generative-ai';

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { schema, customPrompt } = req.body;

    const defaultPrompt = `
      Analyze the following database schema and generate annotations for each table and column.
      For each table and column, provide:
      1. A hypothesis about what this data represents
      2. Questions that would help clarify the purpose and usage
      3. Potential relationships with other tables/columns

      Return the response as a JSON object with the following structure:
      {
        "database": "database_name",
        "annotations": {
          "tables": {
            "table_name": {
              "hypothesis": "string",
              "questions": ["question1", "question2"],
              "columns": {
                "column_name": {
                  "hypothesis": "string",
                  "questions": ["question1", "question2"]
                }
              }
            }
          }
        }
      }
    `;

    const prompt = customPrompt || defaultPrompt;
    const fullPrompt = `${prompt}\n\nDatabase Schema:\n${JSON.stringify(schema, null, 2)}`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      let jsonText = text;
      if (text.includes('```json')) {
        const jsonStart = text.indexOf('```json') + 7;
        const jsonEnd = text.indexOf('```', jsonStart);
        jsonText = text.substring(jsonStart, jsonEnd).trim();
      }

      const annotations = JSON.parse(jsonText);
      res.status(200).json({ success: true, annotations });

    } catch (error) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate annotations',
        details: (error as Error).message
      });
    }
  }