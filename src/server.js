const http = require ("http");
const {mapp} = require ("./app");

const PORT = process.env.PORT || 8000;

const server = http.createServer(mapp);
server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);
});