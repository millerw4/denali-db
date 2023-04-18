const postgres = require('postgres');

const sql = postgres({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
});

module.exports.getQuestions = async function(product_id, page = 0, count = 5) {
let questions = await sql`
  SELECT
    q.id,
    q.body AS question_body,
    q.date_written AS question_date,
    COALESCE(JSONB_AGG(DISTINCT a.body) FILTER (WHERE a.body IS NOT NULL), '[]') AS answers,
    COALESCE(JSONB_AGG(DISTINCT p.url) FILTER (WHERE p.url IS NOT NULL), '[]') AS photos
  FROM questions q
  LEFT JOIN answers a ON a.question_id = q.id
  LEFT JOIN photos p ON p.answer_id = a.id
  WHERE q.product_id = ${product_id}
  GROUP BY q.id
  ORDER BY q.id
  LIMIT ${count}
  OFFSET ${page};
`;
  return questions;
};
function getAnswers(question) {
  return sql`
    select *
      from answers
      where question_id=${question.id}
    `;
}
function getPhotos(answer) {
  return sql`
    select *
      from photos
      where answer_id=${answer.id}
    `;
}
module.exports.updateQuestionHelpful = async function(id) {
  const helpful = await sql`
    select helpful
      from questions
      where id=${id}
    `;
  return await sql`
    update questions
      set helpful=${helpful[0].helpful + 1}
      where id=${id}
    `;
};
module.exports.updateQuestionReported = async function(id) {
  return await sql`
    update questions
      set reported=${1}
      where id=${id}
    `;
};
module.exports.submitQuestion = async function(question) {
  const q = {
    product_id: question.product_id,
    body: question.body,
    date_written: parseInt(Date.now()),
    asker_name: question.name,
    asker_email: question.email,
  };
  // console.log('q: ', q);
  return await sql`insert into questions ${ sql(q) }`;
};
module.exports.updateAnswerHelpful = async function(id) {
  const helpful = await sql`
    select helpful
      from answers
      where id=${id}
    `;
  return await sql`
    update answers
      set helpful=${helpful[0].helpful + 1}
      where id=${id}
    `;
};
module.exports.updateAnswerReported = async function(id) {
  return await sql`
    update answers
      set reported=${1}
      where id=${id}
    `;
};
module.exports.submitAnswer = async function(answer) {
  const a = {
    question_id: answer.question_id,
    body: answer.body,
    date_written: parseInt(Date.now()),
    answerer_name: answer.name,
    answerer_email: answer.email
  };
  const answer_id = await sql`
    insert into answers ${ sql(a) }
      returning answers.id
    `;
  const id = answer_id[0].id;
  // console.log('created answer at id: ', answer_id);
  return Promise.all(answer.photos.map(photo => {
    const p = {
      answer_id: id,
      url: photo
    };
    return sql`insert into photos ${ sql(p) }`;
  }));
};