 import { NextApiRequest, NextApiResponse } from 'next';
  import { GoogleGenerativeAI } from '@google/generative-ai';
  import snowflake from 'snowflake-sdk';

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { annotatedSchema, questions, database } = req.body;

    try {
      const connection = createConnection();
      await new Promise((resolve, reject) => {
        connection.connect((err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });

      // Use the specified database
      await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: `USE DATABASE ${database}`,
          complete: (err) => {
            if (err) reject(err);
            else resolve(null);
          }
        });
      });

      const results = [];
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      for (const question of questions) {
        try {
          // Generate SQL using annotated schema
          const sqlPrompt = `
            Given this annotated database schema and question, generate a SQL query.
            Use the annotations to better understand the data relationships.

            Schema: ${JSON.stringify(annotatedSchema, null, 2)}

            Question: ${question.question}

            Return only the SQL query, no explanation.
          `;

          const sqlResult = await model.generateContent(sqlPrompt);
          const generatedSQL = sqlResult.response.text().trim();

          // Clean up SQL
          let cleanSQL = generatedSQL;
          if (cleanSQL.includes('```sql')) {
            const start = cleanSQL.indexOf('```sql') + 6;
            const end = cleanSQL.indexOf('```', start);
            cleanSQL = cleanSQL.substring(start, end).trim();
          }

          // Execute the generated SQL
          const queryResult = await new Promise((resolve, reject) => {
            connection.execute({
              sqlText: cleanSQL,
              complete: (err, stmt, rows) => {
                if (err) {
                  resolve({ success: false, error: err.message });
                } else {
                  resolve({ success: true, rows: rows?.length || 0 });
                }
              }
            });
          });

          results.push({
            question: question.question,
            generatedSQL: cleanSQL,
            executionSuccess: (queryResult as any).success,
            error: (queryResult as any).error,
            resultCount: (queryResult as any).rows || 0
          });

        } catch (error) {
          results.push({
            question: question.question,
            generatedSQL: null,
            executionSuccess: false,
            error: (error as Error).message,
            resultCount: 0
          });
        }
      }

      connection.destroy();

      // Calculate metrics
      const executionRate = results.filter(r => r.executionSuccess).length / results.length;

      const evaluationSummary = {
        database,
        timestamp: new Date().toISOString(),
        totalQuestions: results.length,
        executionSuccessRate: executionRate,
        results
      };

      res.status(200).json({ success: true, evaluation: evaluationSummary });

    } catch (error) {
      console.error('Spider evaluation error:', error);
      res.status(500).json({
        success: false,
        error: 'Evaluation failed',
        details: (error as Error).message
      });
    }
  }