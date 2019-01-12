'use strict';

module.exports.create = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Candidate created!',
      input: event,
    }),
  };
};
