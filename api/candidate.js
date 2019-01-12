'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDB = AWS.DynamoDB.DocumentClient();

module.exports.create = async (event, context, callback) => {
  const body = JSON.parse(event.body);
  const fullname = body.fullname;
  const email = body.email;
  const age = body.age;

  if (typeof fullname !== 'string' || typeof email !== 'string' || typeof age !== 'number') {
    console.error('Validation failed!');
    callback(new Error('Couldn\'t submit candidate because of validation errors.'));
    return;
  }

  createCandidate(candidateInfo(fullname, email, age))
    .then(res => {
      callback(null, {
        statusCode: 201,
        body: JSON.stringify({
          message: `The candidate with the following email ${email} has been created!`,
          candidateId: res.id,
        })
      })
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to create the candidate with the following email ${email}`,
        })
      });
    });
};

module.exports.getAll = (event, context, callback) => {
  const params = {
    TableName: process.env.CANDIDATE_TABLE,
    ProjectionExpression: "id, fullname, email"
  };

  console.log('Scanning Candidate table.');
  const onScan = (err, data) => {
    if (err) {
      console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
      callback(err);
    } else {
      console.log('Scan succeeded.');
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          candidates: data.Items
        })
      });
    }
  };
  dynamoDb.scan(params, onScan);
};

module.exports.getById = (event, context, callback) => {
  const params = {
    TableName: process.env.CANDIDATE_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };

  dynamoDb.get(params).promise()
    .then(result => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      });
    })
    .catch(error => {
      console.error(error);
      callback(null, {
        statusCode: 404,
        body: JSON.stringify({
          message: `Couldn\'t fetch candidate.`,
        })
      });
    });
};

/**
 *  Create a candidate in DynamoDB
 * @param {object} candidate
 * @returns {object} candidate
 */
const createCandidate = candidate => {
  console.log('Creating candidate...');
  const candidateInfo = {
    TableName: process.env.CANDIDATE_TABLE,
    Item: candidate,
  };
  return dynamoDB.put(candidateInfo).promise()
    .then(res => candidate);
};

/**
 * Init a candidate
 * @param {string} fullname
 * @param {string} email
 * @param {number} age
 * @returns {object} candidate
 */
const candidateInfo = (fullname, email, age) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    fullname: fullname,
    email: email,
    age: age,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
};
