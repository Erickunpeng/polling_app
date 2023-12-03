import express, { Express } from "express";
import {list, get, add} from './routes';
import bodyParser from 'body-parser';


// Configure and start the HTTP server.
const port: number = 8088;
const app: Express = express();
app.use(bodyParser.json());
app.get("/api/get", get)
app.post("/api/add", add)
app.get("/api/list", list)
app.listen(port, () => console.log(`Server listening on ${port}`));
