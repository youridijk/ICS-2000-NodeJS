import {Hub, RESTServer} from './index';


async function main() {
    if (process.argv.length < 4) {
        return console.log('No e-mail and password provided');
    }

    const email = process.argv[2];
    const password = process.argv[3];

    const hub = new Hub(email, password);
    const server = new RESTServer(hub);

    try {
        const port = process.argv.length >= 5 ? Number(process.argv[4]) : 8080;
        await server.setup();
        await server.listen(port);
        console.log("Server started on port " + port);
    } catch (error) {
        console.log(`${error}`);
    }
}

main().then()
