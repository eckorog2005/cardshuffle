var fastify = require('fastify')();
var api = require('./shuffleAPI');

//enable form-encoded bodies (JSON is built in)
fastify.register(require('@fastify/formbody'));

//routes
fastify.get('/shuffle', api.shuffle);
fastify.post('/customDeck', api.customDeck);

//start server
fastify.listen({ port: process.env.PORT, host: process.env.IP || '::' }, function(err){
    if(err){
        console.error(err);
        process.exit(1);
    }
    console.log('app is lisening on port '+process.env.PORT+'....');
});
